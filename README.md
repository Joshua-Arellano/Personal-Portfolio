# josh-a.dev

My portfolio: a single-page site with a small blog, built with plain HTML, CSS
and JavaScript. No frameworks, no bundler, no build step.

```
index.html      the single page — home, about, skills, projects, résumé, blog, contact
styles.css      design tokens (22 themes), layout, components, responsive + print rules
app.js          themes, scroll-spy, project filtering, github block, terminal, keybinds
resume.pdf      the résumé you can actually send — one US Letter page, selectable text
resume.ms       the groff source that typesets resume.pdf
blog/           one HTML file per post, plus _template.html to copy for the next one
headshot.jpg    the portrait index.html loads
```

## Working on it

Open `index.html` straight from disk — no server required. Serving it over HTTP
behaves identically.

Keyboard: `1`–`7` jump to a section, `T` cycles the theme, `S` toggles the
JavaScript-powered extras, `~` opens the terminal, `?` opens the shortcut sheet.

## Regenerating the résumé PDF

`resume.pdf` is typeset from `resume.ms` with groff:

```sh
groff -ms -Tpdf -P-pletter resume.ms > resume.pdf
```

Edit `resume.ms`, re-run that, commit both files. The résumé panel on the page is
the web version; the PDF is the artifact for job applications.

## Adding a blog post

Copy `blog/_template.html` to `blog/<slug>.html`, edit the six things listed at
the top of the template, then link it from the Blog panel in `index.html`. Every
`<h2>`/`<h3>` needs an `id` — the table of contents is generated from those.

## Deploying

The host serving josh-a.dev watches `main`, so merging to `main` is the deploy.

## License

MIT — see [LICENSE](LICENSE).
