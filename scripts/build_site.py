#!/usr/bin/env python3
"""Build the static course site into ./_site for GitHub Pages.

Design goal: adding a new lesson or reference doc requires NO edits here.
The index auto-discovers everything in lessons/ and reference/ by reading
each file's <title>. Run locally with:  python scripts/build_site.py
"""
import re
import shutil
from pathlib import Path

try:
    import markdown  # pip install markdown
except ImportError:  # let the build fail loudly with a clear message
    raise SystemExit("Missing dependency: pip install markdown")

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"

# Markdown files (repo root) -> published HTML pages (site root).
MD_PAGES = {"MISSION.md": "mission.html", "RESOURCES.md": "resources.html"}

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def rewrite_links(html: str) -> str:
    """Point in-repo .md links at their published .html equivalents."""
    for md, page in MD_PAGES.items():
        html = html.replace(md, page)
    return html


def ensure_mobile_head(html: str) -> str:
    """Safety net: every published page needs a viewport meta or it renders
    at desktop width (unreadable) on phones. Inject one if a lesson forgot it."""
    if 'name="viewport"' in html:
        return html
    return ('<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            + html)


def title_of(path: Path, fallback: str) -> str:
    m = TITLE_RE.search(path.read_text(encoding="utf-8"))
    return (m.group(1).strip() if m else fallback)


def copy_dir_with_rewrite(name: str) -> list[Path]:
    src = ROOT / name
    if not src.is_dir():
        return []
    out = SITE / name
    out.mkdir(parents=True, exist_ok=True)
    files = []
    for f in sorted(src.glob("*.html")):
        html = ensure_mobile_head(rewrite_links(f.read_text(encoding="utf-8")))
        (out / f.name).write_text(html, encoding="utf-8")
        files.append(f)
    return files


def page_shell(title: str, body: str, css_href: str = "assets/course.css",
               home: str = "index.html") -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="{css_href}">
</head>
<body>
<p class="kicker"><a href="{home}">← Course home</a></p>
{body}
</body>
</html>
"""


def build_markdown_pages():
    md = markdown.Markdown(extensions=["extra", "sane_lists", "toc"])
    for src_name, out_name in MD_PAGES.items():
        src = ROOT / src_name
        if not src.exists():
            continue
        md.reset()
        html = rewrite_links(md.convert(src.read_text(encoding="utf-8")))
        title = src_name.replace(".md", "")
        (SITE / out_name).write_text(page_shell(title, html), encoding="utf-8")


def build_index(lessons: list[Path], refs: list[Path]):
    def li(path: Path, prefix: str, fallback: str) -> str:
        title = title_of(path, fallback)
        href = f"{prefix}/{path.name}"
        return f'    <li><a href="{href}">{title}</a></li>'

    lesson_items = "\n".join(li(p, "lessons", p.stem) for p in lessons) \
        or '    <li class="muted">No lessons yet.</li>'
    ref_items = "\n".join(li(p, "reference", p.stem) for p in refs) \
        or '    <li class="muted">No reference docs yet.</li>'

    body = f"""<p class="kicker"><span class="lesson-no">COURSE</span>
  <span>A living workspace</span></p>
<h1>Coding Agents × Vaadin × Phoenix</h1>
<p class="subtitle">Understanding coding-agent harnesses deeply enough to make Vaadin
agent-ready — dogfooded through a real Vaadin Flow app, with Arize Phoenix as the
feedback loop. This site is generated automatically from the teaching workspace on every push.</p>

<div class="primary-source">
  <div class="label">Start here</div>
  <div class="src-title"><a href="mission.html">The Mission →</a></div>
  <p style="margin:.4rem 0 0">Why this course exists and what success looks like.
  Then read the lessons in order.</p>
</div>

<h2>Lessons</h2>
<ol class="sources">
{lesson_items}
</ol>

<h2>Reference</h2>
<ul class="sources">
{ref_items}
    <li><a href="resources.html">Resources — curated primary sources</a></li>
</ul>

<div class="ask-teacher">
  <strong>This is a taught course, not just notes.</strong> Each lesson has a live teacher
  (Claude Code) — open the workspace and ask follow-up questions, or request the next lesson.
</div>
"""
    (SITE / "index.html").write_text(page_shell(
        "Coding Agents × Vaadin × Phoenix", body, home="index.html"
    ).replace('<p class="kicker"><a href="index.html">← Course home</a></p>\n', ""),
        encoding="utf-8")


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)

    # Static assets, copied verbatim.
    if (ROOT / "assets").is_dir():
        shutil.copytree(ROOT / "assets", SITE / "assets")

    lessons = copy_dir_with_rewrite("lessons")
    refs = copy_dir_with_rewrite("reference")
    build_markdown_pages()
    build_index(lessons, refs)
    (SITE / ".nojekyll").write_text("", encoding="utf-8")

    print(f"Built site -> {SITE}")
    print(f"  lessons:   {len(lessons)}")
    print(f"  reference: {len(refs)}")


if __name__ == "__main__":
    main()
