(() => {
  "use strict";

  const ACTION_LABELS = new Set([
    "Osserva il riflesso",
    "Barrica la porta",
    "Chiedi chi è",
  ]);

  function makeLabel(symbol, text) {
    const label = document.createElement("span");
    const icon = document.createElement("b");
    icon.className = "label-symbol";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = symbol;
    label.append(icon, document.createTextNode(text));
    return label;
  }

  function makeDialogueBubble(text, { direction, speaker, kind, tone }) {
    const bubble = document.createElement("article");
    bubble.className = `dialogue-bubble dialogue-bubble--${direction} dialogue-bubble--${tone}`;
    bubble.setAttribute("role", "group");
    bubble.setAttribute("aria-label", `${kind} di ${speaker}`);

    const meta = document.createElement("span");
    meta.className = "dialogue-speaker";
    const dot = document.createElement("b");
    dot.setAttribute("aria-hidden", "true");
    dot.textContent = "●";
    meta.append(dot, document.createTextNode(`${kind} · ${speaker}`));

    const copy = document.createElement("p");
    copy.textContent = text;
    bubble.append(meta, copy);
    return bubble;
  }

  function makeActionSelection(text) {
    const block = document.createElement("div");
    block.className = "action-selection";
    block.setAttribute("role", "note");
    block.setAttribute("aria-label", "Azione scelta");
    block.append(makeLabel("◆", "Azione scelta"));
    const copy = document.createElement("p");
    copy.textContent = text;
    block.append(copy);
    return block;
  }

  function decorateBubbles(root) {
    root.querySelectorAll(".bubble").forEach((original) => {
      const text = original.textContent.trim();
      const outgoing = original.classList.contains("outgoing");

      if (outgoing && ACTION_LABELS.has(text)) {
        original.replaceWith(makeActionSelection(text));
        return;
      }

      const isMirrorDialogue = text === "Non sono io quello che devi temere.";
      const bubble = makeDialogueBubble(text, {
        direction: outgoing ? "outgoing" : "incoming",
        speaker: isMirrorDialogue ? "Uomo nel riflesso" : outgoing ? "Tu" : "Sconosciuto",
        kind: isMirrorDialogue ? "Dialogo" : "Messaggio",
        tone: isMirrorDialogue ? "mirror" : original.classList.contains("urgent") ? "urgent" : "default",
      });
      original.replaceWith(bubble);
    });
  }

  function decorateNarration(root) {
    root.querySelectorAll(".story-action-panel").forEach((block) => {
      block.classList.add("narration-block");
      const label = block.querySelector(":scope > span");
      if (label) label.replaceWith(makeLabel("▣", "Narrazione"));
    });

    root.querySelectorAll(".narration:not(.threat-narration)").forEach((block) => {
      block.classList.add("narration-block");
      const label = block.querySelector(":scope > span");
      if (label) label.replaceWith(makeLabel("▣", "Narrazione"));
    });

    root.querySelectorAll(".threat-narration").forEach((block) => {
      block.classList.remove("narration", "threat-narration");
      block.classList.add("environment-block");
      block.setAttribute("aria-label", "Ambiente e percezione");
      const label = block.querySelector(":scope > span");
      if (label) label.replaceWith(makeLabel("◉", "Ambiente"));
    });
  }

  function decorateSystem(root) {
    root.querySelectorAll(".enemy-intent:not(.second)").forEach((panel) => {
      panel.setAttribute("aria-label", "Intento della presenza");
      const label = panel.querySelector(":scope > span");
      if (label) label.replaceWith(makeLabel("◈", "Intento della presenza"));
    });

    root.querySelectorAll(".story-hint").forEach((panel) => {
      panel.setAttribute("aria-label", "Consiglio della modalità Storia");
      const label = panel.querySelector(":scope > span");
      if (label) label.replaceWith(makeLabel("◎", "Consiglio · Modalità Storia"));
    });
  }

  function insertMirrorNarration(root) {
    const mirrorBubble = root.querySelector(".dialogue-bubble--mirror");
    if (!mirrorBubble || root.querySelector(".mirror-narration")) return;

    const narration = document.createElement("div");
    narration.className = "narration narration-block mirror-narration";
    narration.setAttribute("role", "note");
    narration.setAttribute("aria-label", "Narrazione");
    narration.append(makeLabel("▣", "Narrazione"));
    const copy = document.createElement("p");
    copy.textContent = "Nel riflesso, l’uomo inclina appena il capo. Le sue labbra si muovono.";
    narration.append(copy);
    mirrorBubble.before(narration);
  }

  function decorate() {
    const thread = document.querySelector(".story-thread");
    if (!thread) return;
    decorateBubbles(thread);
    decorateNarration(thread);
    decorateSystem(thread);
    insertMirrorNarration(thread);
  }

  let scheduled = false;
  const scheduleDecorate = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      decorate();
    });
  };

  decorate();
  new MutationObserver(scheduleDecorate).observe(document.querySelector("#app"), {
    childList: true,
    subtree: true,
  });
})();
