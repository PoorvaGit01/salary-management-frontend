This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API integration (with Rails)

Run the **Rails API on port 3000** and this app on **3001** so both can run locally. See **[INTEGRATION.md](../INTEGRATION.md)** in the repo root for ports and the `/api/v1` proxy.

### Environment variables

1. Copy the example file and adjust if your API is not on `127.0.0.1:3000`:

   ```bash
   cp .env.example .env.local
   ```

2. **`BACKEND_URL`** — base URL of the Rails API (no trailing slash). Next.js reads this in `next.config.ts` to rewrite browser requests from `/api/v1/*` to the backend.

```bash
PORT=3001 yarn dev
# → http://localhost:3001
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

By default Next.js uses port **3000**; use **3001** when Rails already uses 3000 (see integration note above).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
