import { spawn } from 'node:child_process';

type SecondMeRequestOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

type RawSecondMeResponse = {
  ok: boolean;
  status: number;
  bodyText: string;
  via: 'node' | 'python';
};

export type SecondMeJsonResponse<T> = RawSecondMeResponse & {
  data: T | null;
};

const PYTHON_FALLBACK_SCRIPT = `
import base64
import json
import ssl
import sys
import urllib.error
import urllib.request

config = json.loads(base64.b64decode(sys.argv[1]).decode("utf-8"))
headers = config.get("headers") or {}
body = config.get("body")
if body is not None:
    body = body.encode("utf-8")

request = urllib.request.Request(
    config["url"],
    data=body,
    headers=headers,
    method=config.get("method") or "GET",
)
context = ssl.create_default_context()
timeout_seconds = max((config.get("timeoutMs") or 30000) / 1000, 1)

try:
    with urllib.request.urlopen(request, timeout=timeout_seconds, context=context) as response:
        payload = {
            "ok": True,
            "status": response.status,
            "bodyText": response.read().decode("utf-8", "replace"),
            "via": "python",
        }
except urllib.error.HTTPError as error:
    payload = {
        "ok": False,
        "status": error.code,
        "bodyText": error.read().decode("utf-8", "replace"),
        "via": "python",
    }
except Exception as error:
    print(json.dumps({"error": str(error)}))
    sys.exit(1)

print(json.dumps(payload))
`;

function shouldUsePythonFallback(error: unknown) {
  const candidates: string[] = [];

  if (error instanceof Error) {
    candidates.push(error.message);
  } else if (error) {
    candidates.push(String(error));
  }

  const maybeError = error as
    | {
        code?: string;
        cause?: { code?: string; message?: string };
      }
    | undefined;

  if (maybeError?.code) {
    candidates.push(maybeError.code);
  }

  if (maybeError?.cause?.code) {
    candidates.push(maybeError.cause.code);
  }

  if (maybeError?.cause?.message) {
    candidates.push(maybeError.cause.message);
  }

  const combined = candidates.join(' | ');

  return (
    combined.includes('ECONNRESET') ||
    combined.includes('fetch failed') ||
    combined.includes('secure TLS connection was established')
  );
}

async function requestWithNode({
  url,
  method = 'GET',
  headers,
  body,
  timeoutMs = 30000,
}: SecondMeRequestOptions): Promise<RawSecondMeResponse> {
  const response = await fetch(url, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  });

  return {
    ok: response.ok,
    status: response.status,
    bodyText: await response.text(),
    via: 'node',
  };
}

async function requestWithPython(options: SecondMeRequestOptions): Promise<RawSecondMeResponse> {
  const encodedConfig = Buffer.from(JSON.stringify(options), 'utf8').toString('base64');

  return await new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', PYTHON_FALLBACK_SCRIPT, encodedConfig], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (!stdout.trim()) {
        reject(new Error(stderr.trim() || `Python fallback exited with code ${code ?? 'unknown'}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as RawSecondMeResponse & { error?: string };

        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }

        resolve(parsed);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Python fallback response: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        );
      }
    });
  });
}

export async function secondMeJsonRequest<T>(
  options: SecondMeRequestOptions,
): Promise<SecondMeJsonResponse<T>> {
  let response: RawSecondMeResponse;

  try {
    response = await requestWithNode(options);
  } catch (error) {
    if (!shouldUsePythonFallback(error)) {
      throw error;
    }

    response = await requestWithPython(options);
  }

  let data: T | null = null;

  if (response.bodyText) {
    try {
      data = JSON.parse(response.bodyText) as T;
    } catch {
      data = null;
    }
  }

  return {
    ...response,
    data,
  };
}

export const jsonRequestWithTlsFallback = secondMeJsonRequest;
