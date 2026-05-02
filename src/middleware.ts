/**
 * Keeps the Auth.js session cookie in sync on navigations (recommended for Vercel production).
 * Does not protect routes — all pages stay public unless you add `callbacks.authorized`.
 */
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
