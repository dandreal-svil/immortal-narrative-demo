#!/usr/bin/env python3
"""Deterministic checks for the public M0 semantic narrative prototype."""

from __future__ import annotations

import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HTML_PATH = ROOT / "index.html"
CSS_PATH = ROOT / "styles.css"
JS_PATH = ROOT / "app.js"


class ContractParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.classes: set[str] = set()
        self.story_advice_hidden = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        element_id = attributes.get("id")
        if element_id:
            self.ids.add(element_id)
        if element_id == "story-advice":
            self.story_advice_hidden = "hidden" in attributes
        self.classes.update((attributes.get("class") or "").split())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    for path in (HTML_PATH, CSS_PATH, JS_PATH):
        require(path.is_file(), f"File mancante: {path.name}")

    html = HTML_PATH.read_text(encoding="utf-8")
    css = CSS_PATH.read_text(encoding="utf-8")
    js = JS_PATH.read_text(encoding="utf-8")

    parser = ContractParser()
    parser.feed(html)

    required_ids = {
        "progress",
        "progress-label",
        "story",
        "equip-memory",
        "story-advice",
        "begin-battle",
        "outcome",
        "continue-after-outcome",
        "finish",
        "restart",
    }
    require(required_ids <= parser.ids, f"ID HTML mancanti: {sorted(required_ids - parser.ids)}")

    required_classes = {
        "message-card",
        "story-block--narration",
        "environment-card",
        "system-card",
        "choice",
    }
    require(required_classes <= parser.classes, f"Classi semantiche mancanti: {sorted(required_classes - parser.classes)}")

    for label in (
        "MESSAGGIO · SCONOSCIUTO",
        "NARRAZIONE",
        "AMBIENTE · SUONO E PERCEZIONE",
        "MEMORIA · CAPACITÀ DEL PERSONAGGIO",
        "INTENTO DELLA PRESENZA",
        "SEGNALE OSSERVATO",
        "CONSIGLIO · SOLO MODALITÀ STORIA",
        "DIALOGO · UOMO NEL RIFLESSO",
    ):
        require(label in html, f"Etichetta semantica mancante: {label}")

    require(parser.story_advice_hidden, "Il consiglio deve essere nascosto per impostazione predefinita")
    require("Non sono io quello che devi temere." in html, "Dialogo finale mancante")
    require("L’uomo con la barba e il cappello nero è riflesso proprio dietro di te." in html, "Messaggio chiarito mancante")
    require(not re.search(r"\bskill\b", html, flags=re.IGNORECASE), "Il termine generico 'skill' non deve comparire nell’interfaccia")

    for marker in (
        ".message-card",
        ".story-block",
        ".environment-card",
        ".system-card",
        ".choice",
        "@media (prefers-reduced-motion: reduce)",
    ):
        require(marker in css, f"Contratto CSS mancante: {marker}")

    for marker in (
        'storyAdvice.hidden = state.mode !== "storia"',
        "prototype_identity_selected",
        "prototype_memory_equipped",
        "prototype_mode_selected",
        "prototype_battle_start",
        "prototype_battle_complete",
        "prototype_complete",
        "immortal-narrative:event",
    ):
        require(marker in js, f"Contratto JavaScript mancante: {marker}")

    subprocess.run(["node", "--check", str(JS_PATH)], check=True)
    print("PASS: public semantic prototype contracts and JavaScript syntax")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
