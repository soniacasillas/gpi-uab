#!/usr/bin/env python3
"""Generate a weekly genomics reading radar from the Europe PMC API."""
from __future__ import annotations
import datetime as dt
import html, json, re
from pathlib import Path
import urllib.parse, urllib.request
import xml.etree.ElementTree as ET

TOPICS = {
    "Tema 2 · Seqüenciació": '(TITLE_ABS:"long-read sequencing" OR TITLE_ABS:"genome sequencing technology")',
    "Tema 3 · Assemblatge": '(TITLE_ABS:"genome assembly" OR TITLE_ABS:"telomere-to-telomere" OR TITLE_ABS:pangenome)',
    "Tema 4 · Anotació i transcriptòmica": '(TITLE_ABS:transcriptome OR TITLE_ABS:"gene annotation" OR TITLE_ABS:"regulatory element")',
    "Tema 5 · Evolució genòmica": '(TITLE_ABS:"comparative genomics" OR TITLE_ABS:"genome evolution" OR TITLE_ABS:ortholog)',
    "Tema 6 · Variació i paleogenòmica": '(TITLE_ABS:"structural variation" OR TITLE_ABS:GWAS OR TITLE_ABS:"ancient DNA" OR TITLE_ABS:paleogenomic*)',
}
KEYWORDS = {
    "Tema 2 · Seqüenciació": ("long-read", "long read", "sequencing technolog", "nanopore", "hifi"),
    "Tema 3 · Assemblatge": ("genome assembl", "telomere-to-telomere", "telomere to telomere", "pangenome", "pan-genome"),
    "Tema 4 · Anotació i transcriptòmica": ("transcriptom", "gene annotation", "regulatory element", "rna-seq", "isoform"),
    "Tema 5 · Evolució genòmica": ("comparative genomic", "genome evolution", "genomic evolution", "ortholog", "synten"),
    "Tema 6 · Variació i paleogenòmica": ("structural variant", "structural variation", "genome-wide association", "gwas", "ancient dna", "ancient genome", "paleogen"),
}
API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
OUT = Path(__file__).resolve().parents[1] / "data" / "weekly-publications.md"
ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "updates"
WEEKLY_INDEX = ROOT / "data" / "weekly-index.md"
RELATED = Path(__file__).resolve().parents[1] / "data" / "related-resources.json"
HIGHLIGHT_RULES = ROOT / "data" / "highlights.json"
HIGHLIGHT_DB = ROOT / "data" / "highlighted-publications.json"
HIGHLIGHT_PAGE = ROOT / "destacades.qmd"
TRUSTED_FEEDS = {
    "Nature Podcast": "https://www.nature.com/nature/podcast/rss/nature.xml",
    "Nature · Genomics": "https://www.nature.com/subjects/genomics.rss",
    "Nature · Genetics": "https://www.nature.com/subjects/genetics.rss",
}

def fetch(query: str, start: dt.date, end: dt.date) -> list[dict]:
    dated = f'({query}) AND FIRST_PDATE:[{start.isoformat()} TO {end.isoformat()}] AND HAS_ABSTRACT:Y NOT SRC:PPR'
    params = urllib.parse.urlencode({"query": dated, "format": "json", "resultType": "core", "pageSize": 25, "sort": "CITED desc"})
    req = urllib.request.Request(f"{API}?{params}", headers={"User-Agent": "gpi-uab-teaching-radar/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response).get("resultList", {}).get("result", [])

def link_for(p: dict) -> str:
    if p.get("doi"):
        return "https://doi.org/" + urllib.parse.quote(p["doi"], safe="/()")
    ident = p.get("pmcid") or p.get("pmid") or p.get("id")
    return f"https://europepmc.org/article/{urllib.parse.quote(p.get('source','MED'))}/{urllib.parse.quote(str(ident))}"

def clean_markup(value: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', html.unescape(value or ''))
    text = re.sub(r'\s+', ' ', text).strip()
    return re.sub(r'\s+([.,;:!?])', r'\1', text)

def abstract_summary(paper: dict) -> str:
    """Return a readable 3–4 sentence extractive digest of an English abstract."""
    abstract = clean_markup(paper.get("abstractText", ""))
    abstract = re.sub(r"\b(?:BACKGROUND|OBJECTIVE|METHODS?|RESULTS?|CONCLUSIONS?|IMPORTANCE):\s*", "", abstract, flags=re.I)
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", abstract)
    sentences = [s.strip() for s in sentences if len(s.split()) >= 7]
    if len(sentences) <= 4:
        return " ".join(sentences)
    cues = ("we ", "this study", "here,", "result", "show", "found", "reveal", "suggest", "conclud", "demonstrat")
    scored = []
    for index, sentence in enumerate(sentences):
        lowered = sentence.lower()
        score = sum(2 for cue in cues if cue in lowered)
        if index == 0 or index == len(sentences) - 1:
            score += 2
        scored.append((score, index, sentence))
    chosen = sorted(sorted(scored, reverse=True)[:4], key=lambda item: item[1])
    return " ".join(sentence for _, _, sentence in chosen)

def feed_resources() -> list[dict]:
    items = []
    for source, url in TRUSTED_FEEDS.items():
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "gpi-uab-teaching-radar/1.0"})
            root = ET.fromstring(urllib.request.urlopen(req, timeout=20).read())
            for entry in root.findall(".//item") + root.findall(".//{*}entry"):
                title = clean_markup(entry.findtext("title") or entry.findtext("{*}title") or "")
                link = entry.findtext("link") or entry.findtext("{*}link") or ""
                if not link:
                    link_node = entry.find("{*}link")
                    link = link_node.get("href", "") if link_node is not None else ""
                body = " ".join(entry.itertext())
                if title and link:
                    items.append({"title": title, "url": link.strip(), "source": source, "search": body.lower()})
        except Exception:
            continue
    return items

def related_resources(paper: dict, registry: dict, feed_items: list[dict]) -> list[dict]:
    doi = (paper.get("doi") or "").lower()
    title = clean_markup(paper.get("title", "")).lower().rstrip(".")
    resources = list(registry.get(doi, []))
    for item in feed_items:
        if (doi and doi in item["search"]) or (len(title) > 30 and title in item["search"]):
            if item["title"].lower().rstrip(".") != title and not any(r["url"] == item["url"] for r in resources):
                resources.append({key: item[key] for key in ("title", "url", "source")})
    return resources

def write_text(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines).rstrip() + "\n")

def rebuild_weekly_index() -> None:
    rows = []
    for page in sorted(ARCHIVE.glob("????-??-??.qmd"), reverse=True):
        text = page.read_text(encoding="utf-8")
        count = text.count("::: {.weekly-paper")
        date = dt.date.fromisoformat(page.stem)
        rows.append(f'- [{date.strftime("%d/%m/%Y")}](updates/{page.stem}.html) · {count} articles')
    write_text(WEEKLY_INDEX, ["### Butlletins publicats", "", *rows])

def rebuild_highlights(records: dict) -> None:
    lines = ["---", 'title: "Actualitzacions destacades"', 'subtitle: "Selecció especialment rellevant per als continguts de l’assignatura"',
             "format:", "  html:", "    theme: cosmo", "    css: assets/site.css", "    toc: true", "    link-external-newwindow: true", "---", "",
             "[← Tornar a les actualitzacions](actualitzacions.html)", "",
             "Aquesta selecció és deliberadament restrictiva. Una setmana pot no aportar cap entrada nova; només s’hi incorporen treballs amb una connexió clara amb els conceptes, mètodes o casos centrals de l’assignatura.", ""]
    for record in sorted(records.values(), key=lambda item: item["week"], reverse=True):
        lines += ["::: {.weekly-paper .featured-update}", "**⭐ Actualització destacada**", "", f'### [{record["title"]}]({record["url"]})', "",
                  f'<p class="weekly-citation">{record["citation"]} · Butlletí del {record["date_label"]} · {record["topic"]}</p>', "",
                  record["reason"], "", "**Abstract summary (English)**", "", record["summary"], ""]
        if record["resources"]:
            lines += ["**Related material**", ""] + [f'- [{r["title"]}]({r["url"]}) · {r["source"]}' for r in record["resources"]] + [""]
        lines += [":::", ""]
    write_text(HIGHLIGHT_PAGE, lines)

def main() -> None:
    end = dt.date.today(); start = end - dt.timedelta(days=8)
    registry = json.loads(RELATED.read_text(encoding="utf-8")) if RELATED.exists() else {}
    highlight_rules = json.loads(HIGHLIGHT_RULES.read_text(encoding="utf-8")) if HIGHLIGHT_RULES.exists() else {}
    highlight_db = json.loads(HIGHLIGHT_DB.read_text(encoding="utf-8")) if HIGHLIGHT_DB.exists() else {}
    feed_items = feed_resources()
    lines = [f"*Selecció automàtica: {start.strftime('%d/%m/%Y')}–{end.strftime('%d/%m/%Y')}. Font: Europe PMC.*", ""]
    seen=set(); total=0; failures=0
    for topic, query in TOPICS.items():
        lines += [f"### {topic}", ""]
        try:
            papers=fetch(query,start,end)
        except Exception as exc:
            failures += 1
            lines += [f"No s’ha pogut consultar Europe PMC en aquesta execució ({html.escape(type(exc).__name__)}).", ""]
            continue
        selected=[]
        required = KEYWORDS[topic]
        for paper in papers:
            normalized = paper.get('title','').lower().replace('–','-')
            if not any(term in normalized for term in required):
                continue
            key=paper.get('doi') or paper.get('pmid') or paper.get('title')
            if key and key not in seen:
                seen.add(key); selected.append(paper)
            if len(selected)==3: break
        if not selected:
            lines += ["No s’han recuperat publicacions noves amb aquesta consulta.", ""]
            continue
        for paper in selected:
            raw_title=clean_markup(paper.get('title','Sense títol'))
            title=html.escape(raw_title).replace('\n',' ').strip()
            authors=html.escape(paper.get('authorString','Autoria no disponible')).rstrip('. ')
            nested_journal=paper.get('journalInfo',{}).get('journal',{}).get('title')
            journal=html.escape(paper.get('journalTitle') or nested_journal or 'Revista no disponible')
            year=html.escape(str(paper.get('pubYear','')))
            doi=(paper.get('doi') or '').lower()
            highlight=highlight_rules.get(doi)
            css="::: {.weekly-paper .featured-update}" if highlight else "::: {.weekly-paper}"
            summary=abstract_summary(paper)
            citation=f'{authors}. <em>{journal}</em> ({year}).'
            lines += [css]
            if highlight:
                lines += [f'**⭐ Actualització destacada** — {html.escape(highlight["reason_ca"])}', ""]
            lines += [f"#### [{title}]({link_for(paper)})", "", f'<p class="weekly-citation">{citation}</p>', "",
                      "**Abstract summary (English)**", "", summary, ""]
            resources = related_resources(paper, registry, feed_items)
            if resources:
                lines += ["**Related material**", ""]
                for resource in resources:
                    lines.append(f'- [{html.escape(resource["title"])}]({resource["url"]}) · {html.escape(resource["source"])}')
                lines.append("")
            lines += [":::", ""]
            if highlight:
                highlight_db[doi] = {"title": title, "url": link_for(paper), "citation": citation,
                    "topic": topic, "week": end.isoformat(), "date_label": end.strftime('%d/%m/%Y'),
                    "reason": html.escape(highlight["reason_ca"]), "summary": summary, "resources": resources}
            total += 1
        lines.append("")
    lines += [f"S’han recuperat **{total}** referències no duplicades. Cada resum és una selecció automàtica de 3–4 frases de l’abstract en anglès. Els recursos complementaris només s’afegeixen quan estan registrats i vinculats inequívocament a l’article. Les cerques són públiques a `scripts/update_publications.py`.", ""]
    if failures:
        raise RuntimeError("Europe PMC returned an incomplete result; the existing weekly archive was left unchanged")
    write_text(OUT, lines)
    newsletter = ["---", f'title: "Butlletí de genòmica · {end.strftime("%d/%m/%Y")}"',
        f'subtitle: "Publicacions seleccionades del {start.strftime("%d/%m/%Y")} al {end.strftime("%d/%m/%Y")}"',
        "format:", "  html:", "    theme: cosmo", "    css: ../assets/site.css", "    toc: true", "    toc-depth: 2", "    link-external-newwindow: true", "---", "",
        "[← Tots els butlletins](../actualitzacions.html) · [⭐ Actualitzacions destacades](../destacades.html)", "", *lines]
    newsletter_path = ARCHIVE / f"{end.isoformat()}.qmd"
    if not newsletter_path.exists():
        write_text(newsletter_path, newsletter)
    write_text(HIGHLIGHT_DB, [json.dumps(highlight_db, ensure_ascii=False, indent=2)])
    rebuild_weekly_index()
    rebuild_highlights(highlight_db)

if __name__ == '__main__':
    main()
