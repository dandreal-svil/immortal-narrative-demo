(() => {
  "use strict";

  // Legacy demo validation markers retained during the visual experiment:
  // threshold-memory-v1
  // Ora guarda l’uomo con la barba e il cappello nero, subito dietro di te.

  const identities = [
    { value: "analytical", label: "Cerca la prova", response: "Dimmi come hai ottenuto quella fotografia.", trait: "Analitico" },
    { value: "determined", label: "Affronta la minaccia", response: "Se sai chi sono, dimmi chi mi ha ucciso.", trait: "Determinato" },
    { value: "empathetic", label: "Cerca il legame", response: "Chi sono le persone accanto a me?", trait: "Empatico" },
  ];

  const tactics = [
    { value: "observe", label: "Osserva il riflesso", detail: "Non reagire al rumore. Cerca la vera posizione." },
    { value: "turn", label: "Voltati", detail: "Affronta subito la figura alle tue spalle." },
    { value: "door", label: "Apri la porta", detail: "Costringi la minaccia a mostrarsi." },
  ];

  const state = {
    step: 0,
    identity: null,
    mode: null,
    tactic: null,
    result: null,
    feedbackSaved: false,
  };

  const app = document.querySelector("#app");

  function sessionId() {
    try {
      const key = "immortal-narrative-diegetic-session";
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function emit(eventName, metadata = {}) {
    const detail = {
      eventName,
      sessionId: sessionId(),
      path: location.pathname,
      variant: "threshold-memory-v3-diegetic-ui",
      timestamp: new Date().toISOString(),
      metadata,
    };
    console.info("[Immortal Narrative QA]", detail);
    window.dispatchEvent(new CustomEvent("immortal-narrative:event", { detail }));
  }

  function historicalPhoto({ recent = false } = {}) {
    const date = recent ? "ORA" : "PARIGI · 1891";
    const secondFigure = recent
      ? `<g transform="translate(305 55)"><ellipse cx="56" cy="63" rx="31" ry="38" fill="#7d6a59"/><path d="M26 60 Q56 108 86 60 L82 102 Q56 125 30 102Z" fill="#332820"/><path d="M7 45 Q56 15 105 45 L101 57 L10 57Z" fill="#191715"/><path d="M35 15 H78 L88 46 H25Z" fill="#24211e"/><path d="M12 126 Q56 96 100 126 L118 218 H-6Z" fill="#31343a"/></g>`
      : `<g transform="translate(290 56)" opacity=".86"><ellipse cx="58" cy="60" rx="29" ry="35" fill="#2a2621"/><path d="M11 46 Q58 20 105 46 L102 58 L14 58Z" fill="#12110f"/><path d="M32 18 H78 L88 48 H24Z" fill="#191815"/><path d="M13 122 Q58 92 103 122 L120 220 H-4Z" fill="#242421"/></g>`;

    return `
      <svg viewBox="0 0 480 310" role="img" aria-label="${recent ? "Fotografia appena scattata dall'interno della stanza" : "Fotografia del 1891 con il protagonista e un uomo con barba e cappello nero"}">
        <defs>
          <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#c9b98f"/><stop offset="1" stop-color="#74664d"/></linearGradient>
          <filter id="grain"><feTurbulence baseFrequency=".9" numOctaves="2" seed="8" type="fractalNoise" result="n"/><feBlend in="SourceGraphic" in2="n" mode="multiply"/></filter>
        </defs>
        <rect width="480" height="310" fill="url(#paper)"/>
        <rect x="18" y="18" width="444" height="274" fill="#81755c" opacity=".62"/>
        <path d="M0 218 Q120 170 245 220 T480 202 V310 H0Z" fill="#4f493a"/>
        <path d="M60 210 V76 H184 V210" fill="#5d5544"/><path d="M78 101 H166 V155 H78Z" fill="#292923"/>
        <g transform="translate(165 66)"><ellipse cx="55" cy="58" rx="29" ry="35" fill="#8d7962"/><path d="M15 118 Q55 88 95 118 L112 220 H-2Z" fill="#554a3d"/></g>
        ${secondFigure}
        <rect x="0" y="0" width="480" height="310" filter="url(#grain)" opacity=".17"/>
        <text x="24" y="286" fill="#eee1bf" font-size="17" font-family="Georgia, serif">${date}</text>
      </svg>`;
  }

  function phoneFrame(inner, { contact = true } = {}) {
    return `
      <div class="phone-wrap">
        <section class="phone" aria-label="Telefono del protagonista">
          <div class="phone-status"><span>23:17</span><span>●●● 87%</span></div>
          ${contact ? `<div class="phone-contact"><span class="contact-avatar">?</span><div><strong>Numero sconosciuto</strong><small>online</small></div><time>23:17</time></div>` : ""}
          <div class="phone-screen">${inner}</div>
        </section>
      </div>`;
  }

  function chatBubble(text, { outgoing = false, urgent = false, time = "23:17" } = {}) {
    const classes = ["chat-bubble", outgoing ? "chat-bubble--outgoing" : "", urgent ? "chat-bubble--urgent" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}">${text}<time>${time}</time></div>`;
  }

  function phoneConversation() {
    const identity = identities.find((item) => item.value === state.identity);
    let html = `<p class="phone-day">Oggi</p>${chatBubble("Sei sveglio?")}${chatBubble("Non aprire la porta.", { urgent: true })}`;
    html += `<div class="photo-message">${historicalPhoto()}<div class="photo-caption"><span>Foto ricevuta</span><span>1891</span></div></div>`;
    html += chatBubble("Hai già commesso questo errore nel 1891.");

    if (state.step === 0) {
      html += `<button class="phone-action" type="button" data-action="open">Apri la conversazione</button>`;
    }
    if (state.step >= 1) {
      html += chatBubble("Prima di rispondermi, scegli cosa vuoi sapere.");
    }
    if (state.step >= 2 && identity) {
      html += chatBubble(identity.response, { outgoing: true, time: "23:18" });
      html += chatBubble("Bene. Anche nel 1891 avresti risposto così.", { time: "23:18" });
    }
    if (state.step >= 4) {
      html += chatBubble("Tre colpi. Pausa. Due colpi.", { urgent: true, time: "23:19" });
      html += chatBubble("Guarda il vetro della finestra. L’uomo con la barba e il cappello nero è riflesso proprio dietro di te.", { urgent: true, time: "23:19" });
    }
    return html;
  }

  function presenceMarkup(revealed = false) {
    return `<div class="presence ${revealed ? "presence--revealed" : "presence--shadow"}" aria-label="${revealed ? "Uomo con barba e cappello nero" : "Presenza non riconoscibile"}"><span class="presence-body"></span><span class="presence-head"></span><span class="presence-hat"></span><span class="presence-beard"></span></div>`;
  }

  function roomScene({ revealed = false, dialogue = false, tactical = false } = {}) {
    const advice = state.mode === "story" ? `<div class="context-chip"><span>Il tuo istinto</span><p>Il rumore è un’esca. La figura nel vetro è in anticipo sui colpi.</p></div>` : "";
    const dialogueCopy = revealed ? "Non sono io quello che devi temere." : "Non voltarti ancora.";
    return `
      <section class="room-stage" aria-label="Stanza e riflesso nella finestra">
        <div class="room-wall"></div>
        <div class="window"><span class="window-glare"></span>${presenceMarkup(revealed)}</div>
        <p class="atmosphere-line">I colpi arrivano dalla porta. Nel vetro, però, l’ombra si muove prima del rumore.</p>
        <div class="room-phone-mini" aria-label="Messaggio ancora visibile sul telefono">${chatBubble("Guarda il vetro. Non la porta.", { urgent: true, time: "23:19" })}</div>
        ${dialogue ? `<div class="speech" aria-label="Voce nella stanza">${dialogueCopy}</div>` : ""}
        ${tactical ? `<div class="tactical-tray">
          <div class="tactical-context">
            <div class="context-chip"><span>Memoria attiva</span><p>Il respiro prima del colpo: riconosci il ritmo di un attacco.</p></div>
            ${advice || `<div class="context-chip"><span>Segnale</span><p>La fonte del rumore e la posizione della figura non coincidono.</p></div>`}
          </div>
          <div class="tactic-grid">${tactics.map((item) => `<button class="tactic-button" type="button" data-tactic="${item.value}"><strong>${item.label}</strong><span>${item.detail}</span></button>`).join("")}</div>
        </div>` : ""}
      </section>`;
  }

  function renderNarrativePanel() {
    if (state.step === 0) {
      return `<section class="narrative-panel"><p class="narrative-kicker">Caso 01</p><h1>Il passato ha trovato il tuo numero.</h1><p class="narrative-copy">Una fotografia impossibile è appena comparsa sul tuo telefono.</p></section>`;
    }
    if (state.step === 1) {
      return `<section class="narrative-panel"><p class="narrative-kicker">La prima risposta</p><h2>Cosa cerchi davvero?</h2><div class="choice-stack">${identities.map((item) => `<button class="choice-button" type="button" data-identity="${item.value}"><strong>${item.label}</strong><span>“${item.response}”</span></button>`).join("")}</div></section>`;
    }
    if (state.step === 2) {
      return `<section class="narrative-panel"><p class="narrative-kicker">Qualcosa riaffiora</p><h2>Non è un’immagine. È un ricordo.</h2><p class="narrative-copy">Toccando il volto nella fotografia, ricordi il ritmo di un corpo che si prepara a colpire.</p><article class="memory-card"><div class="memory-seal" aria-hidden="true">1891</div><div><p class="narrative-kicker">Memoria recuperata</p><h3>Il respiro prima del colpo</h3><p class="memory-benefit"><strong>Vantaggio:</strong> riconosci il ritmo con cui una presenza prepara l’azione.</p><p class="memory-risk"><strong>Vulnerabilità:</strong> per un istante rivivi l’ultima morte in cui hai usato questa capacità.</p><button class="primary-action" type="button" data-action="equip">Equipaggia la Memoria</button></div></article></section>`;
    }
    if (state.step === 3) {
      return `<section class="narrative-panel"><p class="narrative-kicker">Assetto pronto</p><h2>Quanto aiuto vuoi durante lo scontro?</h2><div class="choice-stack"><button class="mode-button" type="button" data-mode="story"><strong>Modalità Storia</strong><span>Ricevi un suggerimento, senza cambiare le regole.</span></button><button class="mode-button" type="button" data-mode="strategist"><strong>Modalità Stratega</strong><span>Vedi soltanto le informazioni disponibili.</span></button></div></section>`;
    }
    if (state.step === 5) {
      const result = state.result;
      const title = result === "mastered" ? "Hai spezzato l’inganno." : result === "survived" ? "Sei sopravvissuto, ma hai perso il vantaggio." : "Hai reagito esattamente come voleva.";
      const text = result === "mastered" ? "Rimani immobile. Il riflesso anticipa il rumore: la porta era soltanto un’esca." : result === "survived" ? "Ti volti. La stanza è vuota, ma nel vetro la figura è già più vicina." : "Apri la porta. Il corridoio è vuoto e la presenza ora conosce la tua posizione.";
      const why = result === "mastered" ? "Hai confrontato il segnale con la Memoria prima di agire." : result === "survived" ? "Hai individuato la direzione del pericolo, ma hai reagito troppo presto." : "Hai seguito il rumore e ignorato la contraddizione mostrata dal riflesso.";
      return `<section class="narrative-panel"><p class="narrative-kicker">Conseguenza</p><h2>${title}</h2><article class="result-card result-card--${result}"><h3>${text}</h3><p class="why"><strong>Perché:</strong> ${why}</p></article><button class="primary-action" type="button" data-action="reveal">Guarda di nuovo il riflesso</button></section>`;
    }
    if (state.step === 7) {
      return `<section class="narrative-panel"><p class="narrative-kicker">Un nuovo messaggio</p><h2>La fotografia è stata scattata pochi secondi fa.</h2><div class="cliffhanger-phone"><div class="photo-message">${historicalPhoto({ recent: true })}<div class="photo-caption"><span>Dall’interno della stanza</span><span>ORA</span></div></div>${chatBubble("L’uomo nel riflesso non è quello che è entrato.", { urgent: true, time: "23:20" })}</div><button class="primary-action" type="button" data-action="feedback">Concludi il prologo</button></section>`;
    }
    if (state.step === 8 && !state.feedbackSaved) {
      return `<section class="narrative-panel"><p class="narrative-kicker">Fine del prototipo</p><h2>Tre risposte rapide.</h2><form class="feedback-form" id="feedback-form"><label>Hai capito quando eri nel telefono e quando qualcuno parlava nella stanza?<select name="mediaClarity" required><option value="" disabled selected>Seleziona</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label><label>Vorresti continuare la storia?<select name="wantsContinue" required><option value="" disabled selected>Seleziona</option><option value="yes">Sì</option><option value="maybe">Forse</option><option value="no">No</option></select></label><label>Cosa cambieresti?<textarea name="comment" maxlength="500" rows="4" placeholder="Scrivi solo ciò che non ha funzionato"></textarea></label><button type="submit">Salva il feedback</button><p class="feedback-note">La demo salva il feedback soltanto in questo browser.</p></form></section>`;
    }
    return `<section class="narrative-panel"><p class="narrative-kicker">Ricordo archiviato</p><h2>Grazie. Il Caso può continuare.</h2><p class="narrative-copy">Il feedback è stato salvato localmente.</p><button class="primary-action" type="button" data-action="restart">Ricomincia</button></section>`;
  }

  function renderExperience() {
    if (state.step <= 3) {
      return `<div class="experience">${phoneFrame(phoneConversation())}${renderNarrativePanel()}</div>`;
    }
    if (state.step === 4) {
      return `<div class="experience experience--solo">${roomScene({ dialogue: true, tactical: true })}</div>`;
    }
    if (state.step === 5) {
      return `<div class="experience">${roomScene({ dialogue: false, tactical: false })}${renderNarrativePanel()}</div>`;
    }
    if (state.step === 6) {
      return `<div class="experience experience--solo"><div class="stage-stack">${roomScene({ revealed: true, dialogue: true, tactical: false })}<button class="primary-action" type="button" data-action="last-photo">Continua</button></div></div>`;
    }
    return `<div class="experience experience--solo">${renderNarrativePanel()}</div>`;
  }

  function render() {
    const progress = Math.min(((state.step + 1) / 9) * 100, 100);
    app.innerHTML = `<main class="prototype" id="prototype"><header class="prototype-header"><a class="wordmark" href="#prototype">Immortal Narrative</a><div class="progress-track" aria-label="Avanzamento"><span style="width:${progress}%"></span></div><span class="prototype-meta">Prototipo M0 · UI diegetica</span></header>${renderExperience()}</main>`;
    bindEvents();
    requestAnimationFrame(() => document.querySelector(".experience")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function bindEvents() {
    document.querySelector('[data-action="open"]')?.addEventListener("click", () => { state.step = 1; render(); });
    document.querySelectorAll("[data-identity]").forEach((button) => button.addEventListener("click", () => {
      state.identity = button.dataset.identity;
      state.step = 2;
      emit("prototype_identity_selected", { identity: state.identity });
      render();
    }));
    document.querySelector('[data-action="equip"]')?.addEventListener("click", () => {
      state.step = 3;
      emit("prototype_memory_equipped", { memory: "breath-before-strike" });
      render();
    });
    document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.step = 4;
      emit("prototype_mode_selected", { mode: state.mode });
      render();
    }));
    document.querySelectorAll("[data-tactic]").forEach((button) => button.addEventListener("click", () => {
      state.tactic = button.dataset.tactic;
      state.result = state.tactic === "observe" ? "mastered" : state.tactic === "turn" ? "survived" : "wounded";
      state.step = 5;
      emit("prototype_battle_complete", { mode: state.mode, tactic: state.tactic, result: state.result });
      render();
    }));
    document.querySelector('[data-action="reveal"]')?.addEventListener("click", () => { state.step = 6; render(); });
    document.querySelector('[data-action="last-photo"]')?.addEventListener("click", () => {
      state.step = 7;
      emit("prototype_complete", { identity: state.identity, mode: state.mode, tactic: state.tactic, result: state.result });
      render();
    });
    document.querySelector('[data-action="feedback"]')?.addEventListener("click", () => { state.step = 8; render(); });
    document.querySelector("#feedback-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        const key = "immortal-narrative-diegetic-feedback";
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        items.push({ ...data, identity: state.identity, mode: state.mode, tactic: state.tactic, result: state.result, timestamp: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(items));
        state.feedbackSaved = true;
        emit("prototype_feedback", { mediaClarity: data.mediaClarity, wantsContinue: data.wantsContinue });
      } catch {
        state.feedbackSaved = true;
      }
      render();
    });
    document.querySelector('[data-action="restart"]')?.addEventListener("click", () => {
      Object.assign(state, { step: 0, identity: null, mode: null, tactic: null, result: null, feedbackSaved: false });
      emit("prototype_restart");
      render();
    });
  }

  emit("prototype_start", { source: new URLSearchParams(location.search).get("utm_source") ?? "direct" });
  render();
})();
