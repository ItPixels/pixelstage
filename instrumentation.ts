/**
 * Next.js 15 Instrumentation
 * This file runs once when the server starts and handles error logging
 */

export function register() {
  console.log("[Instrumentation] Server starting...");
  console.log(`[Instrumentation] Node.js version: ${process.version}`);
  console.log(`[Instrumentation] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`[Instrumentation] Timestamp: ${new Date().toISOString()}`);
  console.log("[Instrumentation] Instrumentation registered successfully");
}

/**
 * Handles errors from Server Actions and Route Handlers
 * This function is called when Next.js captures an unhandled error
 */
export async function onRequestError(
  error: Error,
  request: {
    path: string;
    method?: string;
    headers?: Headers;
  },
  context?: {
    route?: string;
    routeType?: string;
  },
) {
  console.error("[Instrumentation] ========================================");
  console.error("[Instrumentation] Server Error Captured");
  console.error("[Instrumentation] ========================================");
  console.error(`[Instrumentation] Path: ${request.path}`);
  console.error(`[Instrumentation] Method: ${request.method || "unknown"}`);
  console.error(`[Instrumentation] Route: ${context?.route || "unknown"}`);
  console.error(`[Instrumentation] Route Type: ${context?.routeType || "unknown"}`);
  console.error(`[Instrumentation] Error Name: ${error.name}`);
  console.error(`[Instrumentation] Error Message: ${error.message}`);
  console.error(`[Instrumentation] Timestamp: ${new Date().toISOString()}`);
  console.error(`[Instrumentation] Stack Trace:`);
  console.error(error.stack);
  console.error("[Instrumentation] ========================================");
}
