exports.handler = async (event) => {
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_FALLBACK_API_URL ||
    "https://backend-production-1dc96.up.railway.app";

  const requestedPath = event.queryStringParameters?.path || "";
  if (!requestedPath.startsWith("/api/")) {
    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid proxy path" }),
    };
  }

  const upstreamUrl = new URL(requestedPath, backendUrl);
  const headers = {};

  for (const [key, value] of Object.entries(event.headers || {})) {
    if (!value) continue;
    const lowered = key.toLowerCase();
    if (["host", "x-forwarded-for", "x-nf-client-connection-ip", "content-length"].includes(lowered)) {
      continue;
    }
    headers[key] = value;
  }

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: event.httpMethod,
      signal: AbortSignal.timeout(10000),
      headers,
      body:
        event.httpMethod === "GET" || event.httpMethod === "HEAD"
          ? undefined
          : event.isBase64Encoded
            ? Buffer.from(event.body || "", "base64")
            : event.body,
    });

    const bodyText = await response.text();
    const responseHeaders = {
      "content-type": response.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    };

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: bodyText,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (/timeout/i.test(error.message) || error.name === "TimeoutError" || error.name === "AbortError");

    return {
      statusCode: timedOut ? 504 : 502,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
      body: JSON.stringify({
        error: timedOut ? "Proxy request timed out" : "Proxy request failed",
        detail: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
