(() => {
  "use strict";

  const FORM_ENDPOINT = "https://formsubmit.co/immortalnarrative.project@gmail.com";
  const LOCAL_BACKUP_KEY = "immortal-narrative-v4-central-feedback-backup";
  const eventLog = [];
  let delivery = null;
  let deliveryInProgress = false;

  window.addEventListener("immortal-narrative:event", (event) => {
    const detail = event.detail || {};
    eventLog.push({
      eventName: detail.eventName || "unknown",
      timestamp: detail.timestamp || new Date().toISOString(),
      metadata: detail.metadata || {},
    });
    if (eventLog.length > 40) eventLog.shift();
  });

  function currentSessionId() {
    try {
      return sessionStorage.getItem("immortal-narrative-v4-session") || "anonymous";
    } catch {
      return "anonymous";
    }
  }

  function buildPayload(answers) {
    const sessionId = currentSessionId();
    return {
      _subject: `Immortal Narrative M0 — feedback ${sessionId.slice(0, 8)}`,
      _template: "table",
      _captcha: "false",
      _url: location.href,
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

  function readBackups() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeBackups(items) {
    try {
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(items.slice(-50)));
    } catch {
      // L'invio centrale continua anche se il browser blocca localStorage.
    }
  }

  function saveBackup(payload, status) {
    const items = readBackups();
    const index = items.findIndex((item) => item.sessione_anonima === payload.sessione_anonima);
    const previous = index >= 0 ? items[index] : {};
    const record = {
      ...previous,
      ...payload,
      nativeDeliveryStatus: status,
      nativeDeliveryUpdatedAt: new Date().toISOString(),
    };
    if (index >= 0) items[index] = record;
    else items.push(record);
    writeBackups(items);
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
    if (note) {
      note.textContent = "Le risposte vengono inviate anonimamente alla casella del progetto. Una copia resta nel browser come sicurezza.";
    }

    const finalCopy = document.querySelector(".experience--solo .narrative-panel .narrative-copy");
    if (finalCopy && /salvato localmente|stato registrato/i.test(finalCopy.textContent)) {
      finalCopy.textContent = "Il feedback è stato registrato. Verifica della consegna alla casella del progetto in corso.";
    }

    const status = ensureStatusElement();
    if (!status || !delivery) return;

    if (delivery.status === "sending") {
      status.textContent = "Invio anonimo del feedback in corso…";
    } else if (delivery.status === "submitted") {
      status.textContent = "Feedback consegnato al servizio email e salvato anche nel browser.";
    } else {
      status.innerHTML = `L’invio automatico non è riuscito. Il feedback è al sicuro nel browser. <a href="${fallbackMailto(delivery.payload)}" style="color:#f0c783;font-weight:800">Invialo tramite email</a>.`;
    }
  }

  function nativePost(payload) {
    return new Promise((resolve, reject) => {
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const frameName = `feedback-frame-${token}`;
      const iframe = document.createElement("iframe");
      iframe.name = frameName;
      iframe.hidden = true;
      iframe.setAttribute("aria-hidden", "true");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = FORM_ENDPOINT;
      form.target = frameName;
      form.hidden = true;

      Object.entries(payload).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value ?? "");
        form.appendChild(input);
      });

      let submitted = false;
      let settled = false;
      const cleanup = () => {
        setTimeout(() => {
          form.remove();
          iframe.remove();
        }, 1000);
      };
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };

      iframe.addEventListener("load", () => {
        if (submitted) finish(resolve);
      });
      iframe.addEventListener("error", () => finish(() => reject(new Error("Errore caricamento endpoint"))));

      document.body.append(iframe, form);
      try {
        submitted = true;
        form.submit();
      } catch (error) {
        finish(() => reject(error));
        return;
      }

      setTimeout(() => finish(resolve), 10000);
    });
  }

  async function deliver(payload) {
    if (deliveryInProgress) return;
    deliveryInProgress = true;
    delivery = { status: "sending", payload };
    saveBackup(payload, "pending");
    renderStatus();

    try {
      await nativePost(payload);
      delivery = { status: "submitted", payload };
      saveBackup(payload, "submitted");
    } catch (error) {
      console.warn("[Immortal Narrative] Native feedback delivery failed", error);
      delivery = { status: "failed", payload };
      saveBackup(payload, "failed");
    } finally {
      deliveryInProgress = false;
      renderStatus();
    }
  }

  function retryPreviousFeedback() {
    const items = readBackups();
    const candidate = [...items].reverse().find((item) => !item.nativeDeliveryStatus || item.nativeDeliveryStatus === "failed" || item.nativeDeliveryStatus === "pending");
    if (!candidate) return;

    const payload = { ...candidate };
    delete payload.deliveryStatus;
    delete payload.deliveryUpdatedAt;
    delete payload.nativeDeliveryStatus;
    delete payload.nativeDeliveryUpdatedAt;
    deliver(payload);
  }

  new MutationObserver(renderStatus).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "feedback-form") return;

    const answers = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Invio in corso…";
    }

    deliver(buildPayload(answers));
  }, true);

  window.addEventListener("load", () => setTimeout(retryPreviousFeedback, 1200), { once: true });
  renderStatus();
})();
