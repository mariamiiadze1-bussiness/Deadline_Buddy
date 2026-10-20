# Pixel-Perfect Replica

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29beda65-bac5-4ea8-be85-68b3c0b2cd1f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Local demo mode

The app starts in demo mode by default. Choose **Start demo** on the sign-in page to explore the app and create, edit, complete, or delete sample tasks without configuring Supabase. Demo changes are saved only in the current browser's local storage.

When Supabase is ready, set `VITE_DEMO_MODE=false` in your local environment and configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to switch back to account-based sign-in and cloud data. Syllabus file uploads require Supabase storage and are unavailable in local demo mode.
