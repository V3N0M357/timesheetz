import fs from 'fs';
import https from 'https';

const html = fs.readFileSync('public/fonts/custom-font.file', 'utf8');

// Find confirm link inside html
const match = html.match(/href="(\/download\/[^"]+)"/) || html.match(/href="([^"]+confirm[^"]+)"/);
console.log('Match found:', match ? match[1] : 'No match');

if (match) {
  let downloadUrl = match[1].replace(/&amp;/g, '&');
  if (!downloadUrl.startsWith('http')) {
    downloadUrl = 'https://drive.usercontent.google.com' + downloadUrl;
  }
  console.log('Downloading from:', downloadUrl);

  const fileStream = fs.createWriteStream('public/fonts/custom-font.ttf');
  https.get(downloadUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      https.get(res.headers.location, (res2) => {
        res2.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('Download finished!');
        });
      });
    } else {
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('Download finished!');
      });
    }
  });
}
