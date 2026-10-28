import type { PostHogSpanProcessor } from "@posthog/ai/otel";

declare global {
  var posthogSpanProcessor: PostHogSpanProcessor | undefined;
}

export async function flushTelemetry() {
  await globalThis.posthogSpanProcessor?.forceFlush();
}
