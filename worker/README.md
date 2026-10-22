# Availability: keeping josh-a.dev up when saturn is down

Saturn serves the site. This directory is the safety net for when it does not.

```
browser -> josh-a.dev  (Cloudflare edge, always reachable)
             |
             +- Worker  failover.js
                  |
                  +- origin.josh-a.dev    tunnel -> nginx on saturn   <- primary
                  |     answers, and not a 5xx?  serve it as-is
                  |
                  +- portfolio.pages.dev  Pages build of this repo    <- mirror
                        served transparently, same URL, no redirect
```

The Worker sits on the `josh-a.dev` routes, which run *before* the origin. The
apex DNS record still points at the tunnel, so removing the Worker degrades to
"saturn, no failover" rather than to a dead hostname.

Failover is fast because a tunnel with no live connector answers `530` / error
`1033` immediately rather than hanging: a powered-off saturn fails over in
milliseconds. `ORIGIN_TIMEOUT_MS` (3s) only covers a server that is up but
wedged.

Static assets (`styles.css`, `headshot.jpg`, fonts) are edge-cached for a year
as `immutable`, so they keep serving during an outage regardless. HTML is not
cached, which is why it is the only thing that genuinely needs the mirror.

## Files

```
failover.js     the Worker
wrangler.toml   name, routes, and the two origin hostnames
```

## One-time setup

1. **Pages mirror.** Create a Pages project from this repo (`Joshua-Arellano/Personal-Portfolio`),
   production branch `main`, build command `rm -rf worker`, output directory `/`.
   The `rm` keeps the Worker source out of the published mirror; the site itself
   has no build step. Note the resulting `*.pages.dev` hostname and put it in
   `wrangler.toml` as `FALLBACK_ORIGIN` if it differs from `portfolio.pages.dev`.

2. **Origin hostname.** Add `origin.josh-a.dev` as a public hostname on the
   existing tunnel (`916c2790-6403-484c-a858-f77ba0ba94bb`), pointing at the same
   `http://web:8080` service, and let Cloudflare create the DNS record. Keep the
   existing `josh-a.dev` hostname on the tunnel as well.

3. **Deploy the Worker** (see below), which creates the routes.

Order matters: the mirror and the origin hostname should exist before the
Worker goes live, otherwise the first outage has nothing to fall back to.

## Deploying

```sh
cd worker
npx wrangler deploy
```

Routes are created with the deploy. Rollback is `npx wrangler rollback`, or
deleting the routes to drop back to serving saturn directly.

## Verifying

```sh
# Which origin is answering right now?
curl -s https://josh-a.dev/_failover          # {"serving":"saturn",...}

# Every response says where it came from.
curl -sI https://josh-a.dev/ | grep -i x-origin

# Then stop the origin and watch it flip:
ssh saturn 'docker stop portfolio-tunnel'
curl -s https://josh-a.dev/_failover          # {"serving":"pages-fallback",...}
ssh saturn 'docker start portfolio-tunnel'
```

Do that drill before trusting it. `npx wrangler tail` shows each decision live.

## Monitoring

Point an uptime monitor at `https://josh-a.dev/_failover` and alert when the
body does not contain `"saturn"`. The endpoint is handled entirely by the Worker
and reports what a visitor would actually be served, so it catches failover
without needing to know anything about saturn.

Watch out for a monitor that runs *on* saturn: it dies with the origin and can
never report the outage.

## Costs and limits

Workers free tier is 100,000 requests/day, and every request to josh-a.dev now
uses one invocation because the route is zone-wide. A portfolio will not come
close, but if it ever matters the routes can be narrowed to the HTML paths,
since cached assets do not need the Worker.

## Things worth knowing

- **Both copies stay in sync** because both deploy from `main`: the existing
  GitHub Action pushes to saturn, Pages builds the mirror.
- **`www.josh-a.dev` has no DNS record** today, so its route is inert. Add the
  record if `www` is ever wanted.
- **The mirror is public** at its `*.pages.dev` hostname. Harmless for a static
  portfolio; canonical tags keep the real hostname as the indexed one.
- **A Cache Rule for HTML** with `stale-if-error` would serve the last good page
  during a brief blip without reaching the mirror at all. Optional, and
  independent of this Worker.
