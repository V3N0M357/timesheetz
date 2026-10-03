import fs from 'fs';
import https from 'https';
import http from 'http';

const fileId = '1t6t0u-aOztYwOwpTVNWMAASBYfY0BcRg';
const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

function fetchUrl(url, cookies = '') {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Cookie': cookies, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = [];
      const setCookie = res.headers['set-cookie'] ? res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : cookies;

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = 'https://drive.google.com' + redirectUrl;
        }
        return resolve(fetchUrl(redirectUrl, setCookie));
      }

      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({ buffer, headers: res.headers, cookies: setCookie });
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('Fetching initial URL...');
  const res1 = await fetchUrl(initialUrl);
  const html = res1.buffer.toString('utf8');
  
  // Check if it's already binary font data (TTF / OTF / WOFF / WOFF2)
  if (res1.buffer[0] === 0x00 && res1.buffer[1] === 0x01 && res1.buffer[2] === 0x00 && res1.buffer[3] === 0x00) {
    console.log('Direct TTF downloaded!');
    fs.writeFileSync('public/fonts/custom-font.ttf', res1.buffer);
    return;
  }
  if (res1.buffer.toString('utf8', 0, 4) === 'OTTO') {
    console.log('Direct OTF downloaded!');
    fs.writeFileSync('public/fonts/custom-font.otf', res1.buffer);
    return;
  }
  if (res1.buffer.toString('utf8', 0, 4) === 'wOFF') {
    console.log('Direct WOFF downloaded!');
    fs.writeFileSync('public/fonts/custom-font.woff', res1.buffer);
    return;
  }
  if (res1.buffer.toString('utf8', 0, 4) === 'wOF2') {
    console.log('Direct WOFF2 downloaded!');
    fs.writeFileSync('public/fonts/custom-font.woff2', res1.buffer);
    return;
  }

  // Find download link or form action or confirm token in Google Drive page
  console.log('HTML response received, size:', html.length);
  
  // Look for confirm token or download url pattern
  const confirmMatch = html.match(/confirm=([a-zA-Z0-9_\-]+)/) || html.match(/name="confirm"\s+value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
  const formActionMatch = html.match(/action="([^"]+)"/);

  console.log('Confirm match:', confirmMatch ? confirmMatch[1] : null);
  console.log('Form action:', formActionMatch ? formActionMatch[1] : null);

  if (confirmMatch) {
    const confirmToken = confirmMatch[1];
    const downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
    console.log('Downloading with confirm token:', downloadUrl);
    const res2 = await fetchUrl(downloadUrl, res1.cookies);
    fs.writeFileSync('public/fonts/custom-font.bin', res2.buffer);
  } else if (formActionMatch) {
    let actionUrl = formActionMatch[1].replace(/&amp;/g, '&');
    if (!actionUrl.startsWith('http')) actionUrl = 'https://drive.google.com' + actionUrl;
    console.log('Downloading via form action URL:', actionUrl);
    const res2 = await fetchUrl(actionUrl, res1.cookies);
    fs.writeFileSync('public/fonts/custom-font.bin', res2.buffer);
  } else {
    // Search for any download url in HTML
    const allUrls = html.match(/\/uc\?[^"'\s]+/g);
    console.log('All uc URLs found:', allUrls);
    if (allUrls && allUrls.length > 0) {
      let targetUrl = allUrls[0].replace(/&amp;/g, '&');
      if (!targetUrl.startsWith('http')) targetUrl = 'https://drive.google.com' + targetUrl;
      const res2 = await fetchUrl(targetUrl, res1.cookies);
      fs.writeFileSync('public/fonts/custom-font.bin', res2.buffer);
    }
  }
}

run().catch(console.error);
