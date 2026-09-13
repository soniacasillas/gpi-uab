#!/usr/bin/env python3
"""Generate a weekly genomics reading radar from the Europe PMC API."""
from __future__ import annotations
import datetime as dt
import html, json, re
from pathlib import Path
import urllib.parse, urllib.request

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

def fetch(query: str, start: dt.date, end: dt.date) -> list[dict]:
    dated = f'({query}) AND FIRST_PDATE:[{start.isoformat()} TO {end.isoformat()}] NOT SRC:PPR'
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
    return re.sub(r'<[^>]+>', '', html.unescape(value or '')).strip()

RELEVANCE = {
    "Tema 2 · Seqüenciació": "Permet discutir com el protocol, la longitud, l’exactitud i la preparació de mostra condicionen les dades que obtenim.",
    "Tema 3 · Assemblatge": "Aporta un cas recent per avaluar continuïtat, completesa, fase i validació d’un assemblatge.",
    "Tema 4 · Anotació i transcriptòmica": "Connecta amb la interpretació de transcrits, isoformes o elements reguladors i amb els límits de cada tipus d’evidència.",
    "Tema 5 · Evolució genòmica": "Ofereix un exemple per relacionar comparació de genomes, història evolutiva i inferència funcional.",
    "Tema 6 · Variació i paleogenòmica": "Permet examinar com el mostreig i la tecnologia afecten la detecció de variació i la inferència sobre poblacions o fenotips.",
}

def automatic_summary(paper: dict, topic: str) -> str:
    """Return two cautious, non-extractive sentences from title and metadata."""
    raw_title = clean_markup(paper.get('title', 'aquest problema')).rstrip('.')
    evidence = (paper.get('abstractText') or '').lower()
    if any(x in evidence for x in ('systematic review', 'we review', 'this review')):
        action = "sintetitza la literatura sobre"
    elif any(x in evidence for x in ('we benchmark', 'we compared', 'we compare', 'comparative evaluation')):
        action = "compara mètodes o dades per estudiar"
    elif any(x in evidence for x in ('we present', 'we developed', 'we develop', 'we introduce')):
        action = "presenta un mètode o recurs centrat en"
    else:
        action = "analitza"
    return f"L’article {action} «{html.escape(raw_title)}». {RELEVANCE[topic]}"

def main() -> None:
    end = dt.date.today(); start = end - dt.timedelta(days=8)
    lines = [f"*Selecció automàtica: {start.strftime('%d/%m/%Y')}–{end.strftime('%d/%m/%Y')}. Font: Europe PMC.*", ""]
    seen=set(); total=0
    for topic, query in TOPICS.items():
        lines += [f"### {topic}", ""]
        try:
            papers=fetch(query,start,end)
        except Exception as exc:
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
            lines.append(f"- [{title}]({link_for(paper)}) — {authors}. *{journal}* ({year}).")
            lines.append(f"  **Resum automàtic:** {automatic_summary(paper, topic)}")
            total += 1
        lines.append("")
    lines += [f"S’han recuperat **{total}** referències no duplicades. Els resums es generen automàticament a partir del títol, el tipus d’estudi i les metadades de l’abstract; cal revisar l’article abans d’emprar-los com a interpretació científica. Les cerques són públiques a `scripts/update_publications.py`.", ""]
    OUT.parent.mkdir(exist_ok=True)
    with OUT.open('w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(lines))

if __name__ == '__main__':
    main()
