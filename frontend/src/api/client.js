const normalizeBase = (value) => String(value || "").replace(/\/+$/, "");

const buildRuntimeApiBaseCandidates = () => {
  if (typeof window === "undefined") return ["http://localhost:4000/api"];

  const { protocol, hostname } = window.location;
  const candidates = ["/api", `${protocol}//${hostname}:4000/api`];

  if (hostname !== "localhost") candidates.push(`${protocol}//localhost:4000/api`);
  if (hostname !== "127.0.0.1") candidates.push(`${protocol}//127.0.0.1:4000/api`);

  return candidates;
};

const API_BASE_CANDIDATES = [
  ...buildRuntimeApiBaseCandidates(),
  import.meta.env.VITE_API_URL
]
  .map(normalizeBase)
  .filter(Boolean)
  .filter((value, index, array) => array.indexOf(value) === index);

const API_BASE = API_BASE_CANDIDATES[0] || "http://localhost:4000/api";

async function parseResponseBody(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => "");
  return {
    message: text || "",
    isNonJsonResponse: true
  };
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const attemptedBases = [];

  for (let index = 0; index < API_BASE_CANDIDATES.length; index += 1) {
    const base = API_BASE_CANDIDATES[index];
    attemptedBases.push(base);

    try {
      const res = await fetch(`${base}${normalizedPath}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await parseResponseBody(res);
      if (res.ok) return data;

      const isRouteNotFound =
        res.status === 404 &&
        typeof data?.error === "string" &&
        data.error.toLowerCase().includes("route not found");
      const isMissingApiOnCurrentOrigin =
        res.status === 404 && base.startsWith("/") && Boolean(data?.isNonJsonResponse);
      const combinedMessage = `${data?.error || ""} ${data?.message || ""}`.toLowerCase();
      const looksLikeProxyFailure =
        res.status >= 500 &&
        (
          base.startsWith("/") ||
          Boolean(data?.isNonJsonResponse) ||
          combinedMessage.includes("proxy") ||
          combinedMessage.includes("econnrefused") ||
          combinedMessage.includes("failed to connect")
        );

      if ((isRouteNotFound || isMissingApiOnCurrentOrigin || looksLikeProxyFailure) && index < API_BASE_CANDIDATES.length - 1) {
        continue;
      }

      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    } catch (error) {
      // Retry only for network/CORS fetch failures.
      if (error instanceof TypeError && index < API_BASE_CANDIDATES.length - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Unable to reach API. Tried: ${attemptedBases.join(", ")}. Check backend URL/CORS and run backend server.`
  );
}

export { API_BASE, API_BASE_CANDIDATES };
