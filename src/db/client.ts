import { createClient } from '@libsql/client';

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('TURSO_CONNECTION_URL environment variable is required');
}

export const db = createClient({
  url: url,
  authToken: authToken || undefined,
});
