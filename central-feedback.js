(() => {
  "use strict";

  const ENDPOINT = "https://formsubmit.co/ajax/immortalnarrative.project@gmail.com";
  const LOCAL_BACKUP_KEY = "immortal-narrative-v4-central-feedback-backup";
  const eventLog = [];
  let delivery = null;

  window.addEventListener("immortal-narrative:event", (event) => {
    const detail = event.detail || {};
    eventLog.push({
      eventName: detail.eventName || "unknown",
      timestamp: detail.timestamp || new Date().toISOString(),
      metadata: detail.metadata || {},
    });
    if (eventLog.length > 40) eventLog.shift();
  });

  function buildPayload(answers) {
    const sessionId = sessionStorage.getItem("immortal-narrative-v4-session") || "anonymous";
    return {
      _subject: `Immortal Narrative M0 — feedback ${sessionId.slice(0, 8)}`,
      _template: "table",
      progetto: "Immortal Narrative",
      prototipo: "M0 esteso v4",
      sessione_anonima: sessionId,
      origine: new URLSearchParams(location.search).get("utm_source") || "direct",
      pagina: location.href,
      ricevuto_il: new Date().toISOString(),
      durata: answers.duration || "non indicata",
      chiarezza_telefono_dialoghi: answers.mediaClarity || "non indicata",
      comprensione_scontro: answers.battleUnderstanding || "non indicata",
      desiderio_di_continuare: answers.wantsContinue || "non indicato",
      commento: answers.comment?.trim() || "nessun commento",
      percorso_scelte_json: JSON.stringify(eventLog),
    };
  }

  function saveBackup(payload, status) {
    try {
      const items = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]");
      const index = items.findIndex((item) => item.sessione_anonima === payload.sessione_anonima);
      const record = { ...payload, deliveryStatus: status, deliveryUpdatedAt: new Date().toISOString() };
      if (index >= 0) items[index] = record;
      else items.push(record);
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(items.slice(-50)));
    } catch {
      // L'invio email continua anche se il browser blocca localStorage.
    }
  }

  function fallbackMailto(payload) {
    const subject = encodeURIComponent(payload._subject);
    const body = encodeURIComponent([
      "Feedback anonimo Immortal Narrative M0",
      "",
      `Sessione: ${payload.sessione_anonima}`,
      `Durata: ${payload.durata}`,
      `Chiarezza telefono/dialoghi: ${payload.chiarezza_telefono_dialoghi}`,
      `Comprensione scontro: ${payload.comprensione_scontro}`,
      `Vorrebbe continuare: ${payload.desiderio_di_continuare}`,
      `Commento: ${payload.commento}`,
      "",
      `Percorso: ${payload.percorso_scelte_json}`,
    ].join("\n"));
    return `mailto:immortalnarrative.project@gmail.com?subject=${subject}&body=${body}`;
  }

  function ensureStatusElement() {
    const panel = document.querySelector(".experience--solo .narrative-panel");
    if (!panel || !/Grazie|Ricordo archiviato/i.test(panel.textContent)) return null;
    let status = panel.querySelector("[data-feedback-delivery]");
    if (!status) {
      status = document.createElement("div");
      status.dataset.feedbackDelivery = "";
      status.setAttribute("role", "status");
      status.style.cssText = "margin-top:18px;padding:14px 16px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(17,21,28,.92);color:#d5d6d9;line-height:1.5";
      panel.insertBefore(status, panel.querySelector(".primary-action"));
    }
    return status;
  }

  function renderStatus() {
    const note = document.querySelector(".feedback-note");
    if (note) note.textContent = "Le risposte vengono inviate anonimamente alla casella del progetto. Una copia resta in questo browser come sicurezza.";

    const finalCopy = document.querySelector(".experience--solo .narrative-panel .narrative-copy");
    if (finalCopy && /salvato localmente/i.test(finalCopy.textContent)) {
      finalCopy.textContent = "Il feedback è stato registrato. Verifica dello stato di consegna in corso.";
    }

    const status = ensureStatusElement();
    if (!status || !delivery) return;

    if (delivery.status === "sending") {
      status.textContent = "Invio anonimo del feedback in corso…";
    } else if (delivery.status === "sent") {
      status.textContent = "Feedback inviato correttamente alla casella del progetto e salvato anche nel browser.";
    } else {
      status.innerHTML = `L’invio automatico non è riuscito. Il feedback è al sicuro nel browser. <a href="${fallbackMailto(delivery.payload)}" style="color:#f0c783;font-weight:800">Invialo tramite email</a>.`;
    }
  }

  new MutationObserver(renderStatus).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "feedback-form") return;

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Invio in corso…";
    }

    const answers = Object.fromEntries(new FormData(form).entries());
    await Promise.resolve();

    const payload = buildPayload(answers);
    delivery = { status: "sending", payload };
    saveBackup(payload, "pending");
    renderStatus();

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === "false") {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      delivery = { status: "sent", payload };
      saveBackup(payload, "sent");
    } catch (error) {
      console.warn("[Immortal Narrative] Central feedback delivery failed", error);
      delivery = { status: "failed", payload };
      saveBackup(payload, "failed");
    }

    renderStatus();
  }, true);

  renderStatus();
})();