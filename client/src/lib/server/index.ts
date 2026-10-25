/**
 * Server-side API utilities for Server Components.
 *
 * These functions run on the server (in async Server Components) and fetch data
 * directly from the Express backend using the auth token from cookies.
 * They are designed to be used in Server Components for initial data loading (SSR/ISR).
 */
export * from "./api";
export * from "./actions";