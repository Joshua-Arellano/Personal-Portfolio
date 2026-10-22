.\" ===========================================================================
.\" Joshua Arellano — résumé source
.\" ---------------------------------------------------------------------------
.\" The shippable artifact: index.html links to the generated resume.pdf with a
.\" plain <a download>, so downloading it needs no JavaScript at all.
.\"
.\" Rebuild after editing (from the project root):
.\"     groff -ms -Tpdf -P-pletter resume.ms > resume.pdf
.\"
.\" -ms supplies the paragraph/list macros; -P-pletter selects US Letter
.\" (gropdf defaults to A4). Everything is text, so the PDF is selectable and
.\" parses cleanly in applicant-tracking systems.
.\"
.\" Macros below each reset the indent — ms's .IP leaves it set, which would
.\" otherwise push later paragraphs and the section rules past the margin.
.\" ===========================================================================

.pl 11i
.nr HM 0.4i
.nr FM 0.4i
.po 0.7i
.ll 7.1i
.ps 9
.vs 11p

.\" section heading: bold, with a rule the full measure wide
.\" RS: back to the full measure. ms's .IP narrows the line length and
.\" resetting the indent alone does not restore it, so blocks start here.
.de RS
.in 0
.ll 7.1i
..

.de SHD
.RS
.sp 0.42v
.ft B
\\$1
.ft R
.br
.sp 0.06v
\\l'7.1i'
.sp 0.13v
..

.\" entry line: role on the left, dates hard right
.de ENT
.RS
.sp 0.25v
.tl @\\fB\\$1\\fR@ @\\$2@
..

.\" bullet: its own hanging indent, so the measure stays predictable
.de BUL
.RS
.in 0.22i
.ll 6.88i
.ti -0.22i
\(bu\ 
..

.\" --- header ---------------------------------------------------------------
.ps 15
.vs 15p
.ft B
Joshua Arellano
.ft R
.ps 9
.vs 10.5p
.sp 0.2v
contact@josh-a.dev \(em josh-a.dev \(em github.com/Joshua-Arellano \(em Missouri, USA
.ps 9
.vs 10.5p

.SHD SUMMARY
Aspiring developer focused on type-safe languages, terminal tooling and open-source
software. Currently building a TypeScript API issue tracker and finishing an
Application & Web Development degree at Ranken Technical College.

.SHD EDUCATION
.ENT "Ranken Technical College" "2025 \(en 2027"
.RS
Application & Web Development (AWD)
.BUL
Coursework in HTML & CSS, JavaScript, C# and React/Node.js.
.BUL
Capstone work: full-stack web apps and database-driven desktop tools.

.SHD EXPERIENCE
.ENT "Creator & Maintainer \(em API Issue Tracker" "2026 \(en present"
.BUL
Designed a MERN-stack API for tracking issues inside a codebase.
.BUL
Implemented CRUD plus status, priority, reproduction steps, assignees, creation dates
and time logging.
.BUL
Own the endpoint routes, controllers and data structure, and maintain the tracker day
to day.
.ENT "Kitchen Staff \(em Lead Baker, Kaldi's Coffee" "2024 \(en present"
.BUL
Prepared bakery according to recipes, quality and presentation standards.
.BUL
Maintained cleanliness and sanitation of work areas and equipment to ensure compliance
with food safety regulations.
.BUL
Collaborated with team members to ensure smooth operation during peak hours.
.BUL
Managed inventory levels by FIFO, and handled low stock and waste.
.SHD PROJECTS
.ENT "API Issue Tracker" "TypeScript \(em Express \(em MongoDB"
.RS
MERN-stack API for tracking issues in a codebase: CRUD, status, priority, reproduction
steps, assignees and time logging.
.ENT "Weather App" "React.js \(em OpenWeatherMap"
.RS
Responsive app that fetches real-time weather for any city.
.ENT "Video Game Storage" "HTML5 \(em CSS3 \(em Vanilla JS"
.RS
Catalog and manage a video game collection in the browser.
.ENT "Emulator Frontend" "C# \(em MySQL"
.RS
CRUD desktop app to manage NES collections and launch games.

.SHD SKILLS
.RS
\fBTechnical:\fR HTML/CSS, JS/TS, Node.js, React/Vite, C#, .NET / ASP.NET, Express,
Lua, MongoDB, MySQL, Git, object-oriented design.

.SHD "LANGUAGES & INTERESTS"
.RS
\fBLanguages:\fR English (native).
.sp 0.3v
.RS
\fBInterests:\fR soldering, homelab, drawing, CLI & TUI tools, open source.
