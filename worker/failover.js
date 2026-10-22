/**
 * ============================================================================
 * josh-a.dev  ·  edge failover  ·  saturn -> Cloudflare Pages
 * ============================================================================
 * Saturn (the home server) is the real origin, reached over a Cloudflare
 * Tunnel at origin.josh-a.dev. This Worker sits on the josh-a.dev routes so
 * the site survives saturn going away: it proxies to the tunnel, and when the
 * tunnel cannot answer it serves the same files from the Cloudflare Pages
 * mirror of this repo instead.
 *
 * The visitor's URL never changes and nothing is redirected. The fallback is a
 * different origin for the same hostname, not a different hostname.
 *
 *   GET josh-a.dev/whatever
 *     +- primary   origin.josh-a.dev    (tunnel -> nginx on saturn)
 *     |    answered inside ORIGIN_TIMEOUT_MS and not a 5xx?  -> serve it
 *     +- fallback  portfolio.pages.dev  (Pages build of this repo)
 *
 * A tunnel with no live connector answers 530 / error 1033 straight away
 * rather than timing out, so a server that is off fails over in milliseconds;
 * the timeout only covers a server that is up but wedged.
 *
 * Deployed with wrangler from this directory. See README.md.
 * ============================================================================
 */

/** Origin reached through the Cloudflare Tunnel to saturn. */
const PRIMARY_ORIGIN = "origin.josh-a.dev";

/** Cloudflare Pages mirror of this repo, served when the tunnel is down. */
const FALLBACK_ORIGIN = "portfolio.pages.dev";

/** How long to wait on saturn before giving up and serving the mirror. */
const ORIGIN_TIMEOUT_MS = 3000;

/**
 * Reports which origin is serving, for uptime monitors. Handled entirely by
 * the Worker, so it is never a path the site itself has to serve.
 */
const HEALTH_PATH = "/_failover";

export default {
  /**
   * @param {Request} request
   * @param {{ PRIMARY_ORIGIN?: string, FALLBACK_ORIGIN?: string, ORIGIN_TIMEOUT_MS?: string }} env
   */
  async fetch(request, env) {
    const config = {
      primary: env?.PRIMARY_ORIGIN || PRIMARY_ORIGIN,
      fallback: env?.FALLBACK_ORIGIN || FALLBACK_ORIGIN,
      timeoutMs: Number(env?.ORIGIN_TIMEOUT_MS) || ORIGIN_TIMEOUT_MS,
    };

    const url = new URL(request.url);

    if (url.pathname === HEALTH_PATH) return health(request, url, config);

    let originFailed = false;

    try {
      const fromSaturn = await fetchOrigin(
        request,
        url,
        config.primary,
        config.timeoutMs,
      );
      if (!isDown(fromSaturn)) return tag(fromSaturn, "saturn");
      originFailed = true;
    } catch {
      // Timeout, refused connection, or the tunnel with no connector behind
      // it. Either way saturn is not answering, so fall through to the mirror.
      originFailed = true;
    }

    // A write cannot be replayed against a static mirror, so it gets an honest
    // error instead of a mirror's 404.
    if (!isReadOnly(request)) {
      return problem(
        502,
        `origin ${config.primary} unavailable (${originFailed ? "no answer" : "error"})`,
      );
    }

    try {
      const fromPages = await fetchOrigin(request, url, config.fallback);
      return tag(fromPages, "pages-fallback");
    } catch {
      return problem(503, "both saturn and the Pages mirror are unreachable");
    }
  },
};

/**
 * Fetch the same path from a different origin, leaving the public hostname out
 * of it. Used for both the tunnel and the mirror.
 *
 * @param {Request} request
 * @param {URL} url
 * @param {string} hostname
 * @param {number} [timeoutMs]
 * @returns {Promise<Response>}
 */
function fetchOrigin(request, url, hostname, timeoutMs) {
  const target = new URL(url);
  target.hostname = hostname;

  const headers = new Headers(request.headers);
  // Host is derived from the URL, never forwarded: passing the incoming Host
  // through would send the tunnel to itself.
  headers.delete("host");

  /** @type {RequestInit} */
  const init = {
    method: request.method,
    headers,
    // Manual so a redirect, if the origin ever grows one, is handed to the
    // browser rather than followed inside the Worker.
    redirect: "manual",
  };
  if (timeoutMs) init.signal = AbortSignal.timeout(timeoutMs);
  if (!isReadOnly(request)) init.body = request.body;

  return fetch(target, init);
}

/**
 * A 5xx means the tunnel answered on behalf of a server that is not there:
 * 530 / error 1033 is what a stopped cloudflared container returns.
 *
 * @param {Response} response
 */
function isDown(response) {
  return response.status >= 500;
}

/**
 * @param {Request} request
 */
function isReadOnly(request) {
  return request.method === "GET" || request.method === "HEAD";
}

/**
 * Copy a response, stamping which origin produced it. Handy in devtools and
 * the hook uptime monitors use to notice failover.
 *
 * @param {Response} response
 * @param {"saturn" | "pages-fallback"} origin
 */
function tag(response, origin) {
  const tagged = new Response(response.body, response);
  tagged.headers.set("x-origin", origin);
  return tagged;
}

/**
 * @param {number} status
 * @param {string} message
 */
function problem(status, message) {
  return new Response(message + "\n", {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Probe the primary origin and report what a visitor would actually be served.
 * A 404 from saturn still counts as "saturn", because it proves the origin
 * answered; only a 5xx or no answer at all means failover is active.
 *
 * Point an uptime monitor at /_failover and alert on the body not containing
 * "saturn".
 *
 * @param {Request} request
 * @param {URL} url
 * @param {{ primary: string, fallback: string, timeoutMs: number }} config
 */
async function health(request, url, config) {
  let serving = "pages-fallback";

  try {
    const fromSaturn = await fetchOrigin(
      request,
      url,
      config.primary,
      config.timeoutMs,
    );
    if (!isDown(fromSaturn)) serving = "saturn";
  } catch {
    // Left as pages-fallback.
  }

  return new Response(
    JSON.stringify({ serving, checkedAt: new Date().toISOString() }) + "\n",
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-origin": serving,
      },
    },
  );
}
