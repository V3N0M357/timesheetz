# Timesheetz

Timesheetz is a sleek, modern work hours and earnings tracker built with Next.js 16, TypeScript, and a Turso Database backend. It features a premium dark glassmorphism user interface, email/password authentication, and dynamic earnings calculations.

## Live 1-Click Deployment

Deploy your own instance of Timesheetz to Vercel in seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FV3N0M357%2Ftimesheetz&env=TURSO_CONNECTION_URL,TURSO_AUTH_TOKEN,JWT_SECRET)

*During deployment, you will be prompted to supply the environment variables for your Turso Database connection.*

---

## Environment Configuration

To run the application, you need the following environment variables:

- `TURSO_CONNECTION_URL`: Your Turso connection URL (e.g. `libsql://your-db-username.turso.io`)
- `TURSO_AUTH_TOKEN`: Your Turso database authorization token
- `JWT_SECRET`: A secure random secret string (at least 32 characters) used to sign user session cookies

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   *By default, the local environment uses a file-based SQLite database (`local.db`) so you can test it immediately without setting up Turso.*

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
