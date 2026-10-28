import { OpenTelemetry } from "@ai-sdk/otel";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PostHogSpanProcessor } from "@posthog/ai/otel";
import { registerTelemetry } from "ai";

const projectToken = process.env.POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.POSTHOG_HOST;

if (projectToken && posthogHost) {
  const processor = new PostHogSpanProcessor({
    projectToken,
    host: posthogHost,
    privacyMode: false,
  });
  // Route handlers flush this after each response; see lib/telemetry.ts
  globalThis.posthogSpanProcessor = processor;

  new NodeSDK({
    resource: resourceFromAttributes({ "service.name": "dragon-names" }),
    spanProcessors: [processor],
  }).start();

  registerTelemetry(
    new OpenTelemetry({
      enrichSpan: ({ runtimeContext }) => ({
        "$ai_session_id":
          typeof runtimeContext?.sessionId === "string"
            ? runtimeContext.sessionId
            : undefined,
      }),
    }),
  );
} else if (process.env.NODE_ENV === "development") {
  console.error(
    "POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (!posthogHost && process.env.NODE_ENV === "development") {
  console.error(
    "POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_HOST is configured",
  );
}
