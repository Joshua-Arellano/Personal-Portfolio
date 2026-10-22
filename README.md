# josh-a.dev

My portfolio: one page plus a small blog, in plain HTML, CSS and JavaScript.
No framework, no bundler, no build step.

```
index.html      the single page — home, about, skills, projects, résumé, blog, contact
styles.css      design tokens (22 themes), layout, components, responsive + print rules
app.js          themes, scroll-spy, project filtering, github block, terminal, keybinds
resume.pdf      the résumé I actually send — one US Letter page, selectable text
resume.ms       the groff source that typesets resume.pdf
blog/           one HTML file per post, plus _template.html to start the next one
headshot.jpg    the portrait index.html loads
```

## Running it

There is nothing to install. Opening `index.html` straight from disk works, and
serving it over HTTP behaves identically.

A few keys do things: `1`–`7` jump between sections, `T` cycles the theme, `S`
switches the JavaScript-powered extras off and on, `~` opens the terminal, and
`?` brings up the shortcut sheet.

## The résumé

`resume.pdf` is typeset from `resume.ms` with groff, so the PDF and the résumé
panel on the page are two renderings of the same content:

```sh
groff -ms -Tpdf -P-pletter resume.ms > resume.pdf
```

The panel is what visitors read; the PDF is the artifact that goes out with job
applications.

## The blog

Every post is one file in `blog/`, and `blog/_template.html` collects the handful
of things worth changing before writing a new one. Posts get linked from the Blog
panel in `index.html`, and the table of contents is generated from the `id` on
each `<h2>`/`<h3>`, so those have to be there.

## Deploying

The site is self-hosted — nginx on a home server, put on josh-a.dev through a
Cloudflare Tunnel. Pushing to `main` is the whole deploy: a GitHub Action
fast-forwards the checkout on the server, and nothing else has to run.

The home server is not meant to be a single point of failure.
[`worker/`](worker/README.md) holds a Cloudflare Worker that would serve the same
files from a Pages mirror whenever the tunnel is down — same URL, no redirect —
but it is not deployed yet.

## License

MIT — see [LICENSE](LICENSE).
