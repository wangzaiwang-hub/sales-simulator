const TOKEN_KEY = "sales-simulator-token";
const USER_KEY = "sales-simulator-user";
const TOKEN_COOKIE_KEY = "sales_simulator_token";

function buildCookieAttributes(maxAgeSeconds: number) {
  const attributes = [`Max-Age=${maxAgeSeconds}`, "Path=/", "SameSite=Lax"];

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;

  const localToken = window.localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    return localToken;
  }

  const cookieToken = readCookie(TOKEN_COOKIE_KEY);
  if (cookieToken) {
    window.localStorage.setItem(TOKEN_KEY, cookieToken);
    return cookieToken;
  }

  return null;
}

export function persistAuthSession(token: string, user?: unknown) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; ${buildCookieAttributes(60 * 60 * 24 * 7)}`;

  if (typeof user !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_COOKIE_KEY}=; ${buildCookieAttributes(0)}`;
}

