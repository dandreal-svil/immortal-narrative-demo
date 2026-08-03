(() => {
  "use strict";

  const identities = [
    { value: "analytical", label: "Cerca la prova", response: "Dimmi come hai ottenuto quella fotografia.", trait: "Analitico — noti le incoerenze prima degli altri." },
    { value: "determined", label: "Affronta la minaccia", response: "Se sai chi sono, dimmi chi mi ha ucciso.", trait: "Determinato — agisci anche quando il passato fa male." },
    { value: "empathetic", label: "Cerca il legame", response: "Chi sono gli uomini che mi circondano?", trait: "Empatico — riconosci ciò che gli altri tentano di nascondere." },
  ];

  const firstMoves = [
    { value: "observe", label: "Osserva il riflesso", detail: "Rimani immobile e controlli il vetro della finestra." },
    { value: "barricade", label: "Barrica la porta", detail: "Reagisci al rumore e spingi il mobile contro l’ingresso." },
    { value: "answer", label: "Chiedi chi è", detail: "Rompi il silenzio e costringi la presenza a rispondere." },
  ];

  const state = {
    step: 0,
    identity: null,
    mode: null,
    firstMove: null,
    finalMove: null,
    result: null,
    feedbackStatus: "idle",
    feedbackMessage: "",
  };

  const app = document.querySelector("#app");

  function sessionId() {
    const key = "immortal-m0-session";
    try {
      let value = sessionStorage.getItem(key);
      if (value) return value;
      value = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, value);
      return value;
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function emit(eventName, metadata = {}) {
    const payload = {
      eventName,
      sessionId: sessionId(),
      path: location.pathname,
      variant: "threshold-memory-v1",
      timestamp: new Date().toISOString(),
      metadata,
    };
    console.info("[Immortal Narrative QA]", payload);
    window.dispatchEvent(new CustomEvent("immortal-narrative:event", { detail: payload }));
  }

  function selectedIdentity() {
    return identities.find((item) => item.value === state.identity);
  }

  function selectedFirstMove() {
    return firstMoves.find((item) => item.value === state.firstMove);
  }

  function renderStory() {
    const identity = selectedIdentity();
    const firstMove = selectedFirstMove();
    let html = `
      <p class="story-day">Oggi</p>
      <div class="bubble incoming">Sei sveglio?</div>
      <div class="bubble incoming urgent">Non aprire la porta.</div>
      <div class="story-photo">
        <img src="https://immortal-narrative-m0.dandrea-l.chatgpt.site/images/hero-1891-photo.png" alt="Fotografia di gruppo del 1891 con una persona identica al protagonista" width="1456" height="1088" loading="eager" decoding="async">
        <span>Parigi • 1891</span>
      </div>
      <div class="bubble incoming">Hai già commesso questo errore nel 1891.</div>`;

    if (state.step === 0) {
      html += `<div class="story-action-panel"><span class="narration-label"><b class="label-symbol" aria-hidden="true">✦</b>Narrazione</span><p>Una fotografia impossibile è appena comparsa sul tuo telefono.</p><button type="button" data-action="open">Apri la conversazione</button></div>`;
    }

    if (state.step >= 1) {
      html += `<div class="bubble incoming">Prima di rispondermi, scegli cosa cerchi davvero.</div>`;
    }

    if (state.step === 1) {
      html += `<div class="story-choices" aria-label="Scegli la tua risposta">${identities.map((item) => `
        <button type="button" data-identity="${item.value}"><strong>${item.label}</strong><span>“${item.response}”</span></button>`).join("")}</div>`;
    }

    if (state.step >= 2 && identity) {
      html += `
        <div class="bubble outgoing">${identity.response}</div>
        <div class="identity-stamp"><span>Tratto emerso</span><strong>${identity.trait}</strong></div>
        <div class="bubble incoming">Bene. Anche nel 1891 avresti risposto così.</div>
        <div class="narration" role="note" aria-label="Narrazione"><span><b class="label-symbol" aria-hidden="true">✦</b>Narrazione</span><p>Osservi il tuo volto nella fotografia. Un ricordo riaffiora.</p></div>`;
    }

    if (state.step === 2) {
      html += `
        <div class="memory-reveal">
          <div class="memory-object" aria-hidden="true"><span>1891</span><i></i></div>
          <div><span>Memoria recuperata</span><h2>Il respiro prima del colpo</h2><p><b>Vantaggio:</b> riconosci il ritmo con cui un avversario prepara l’azione.</p><p class="memory-risk"><b>Vulnerabilità:</b> per un istante rivivi la tua ultima morte.</p><button type="button" data-action="equip">Equipaggia la Memoria</button></div>
        </div>`;
    }

    if (state.step >= 3) {
      html += `<div class="system-line"><b aria-hidden="true">✓</b> Memoria equipaggiata nell’Assetto</div><div class="bubble incoming urgent">Tre colpi. Pausa. Due colpi. Sta iniziando.</div>`;
    }

    if (state.step === 3) {
      html += `
        <div class="mode-picker"><p>Scegli quanta assistenza vuoi durante lo scontro.</p>
          <button type="button" data-mode="story"><strong>Modalità Storia</strong><span>Mostra un suggerimento tattico.</span></button>
          <button type="button" data-mode="strategist"><strong>Modalità Stratega</strong><span>Mostra solo segnali e intenzione.</span></button>
        </div>`;
    }

    if (state.step >= 4) {
      html += `
        <div class="narration threat-narration" role="note" aria-label="Narrazione"><span><b class="label-symbol" aria-hidden="true">✦</b>Narrazione</span><p>Qualcosa colpisce la porta tre volte. Nel vetro della finestra, però, vedi un’ombra muoversi alle tue spalle.</p></div>
        <div class="enemy-intent" role="note" aria-label="Tattica della presenza"><span><b class="label-symbol" aria-hidden="true">◈</b>Tattica della presenza</span><strong>Distrarti con il rumore.</strong><p>I colpi servono ad attirare la tua attenzione verso la porta.</p>${state.mode === "story" ? `<div class="story-hint" role="note" aria-label="Aiuto della modalità Storia"><span><b class="label-symbol" aria-hidden="true">◎</b>Aiuto · Modalità Storia</span><p>Il rumore è un’esca: la minaccia non si trova davanti a te.</p></div>` : ""}</div>`;
    }

    if (state.step === 4) {
      html += `<div class="story-choices tactical" aria-label="Prima decisione tattica">${firstMoves.map((item) => `<button type="button" data-first-move="${item.value}"><strong>${item.label}</strong><span>${item.detail}</span></button>`).join("")}</div>`;
    }

    if (state.step >= 5 && firstMove) {
      const consequence = state.firstMove === "observe"
        ? "Non ti muovi. Il riflesso anticipa i colpi di mezzo secondo: hai letto il vero attacco."
        : state.firstMove === "barricade"
          ? "Il mobile gratta il pavimento. La presenza ottiene ciò che voleva: sa esattamente dove sei."
          : "La tua voce torna dal corridoio prima ancora che tu finisca la domanda.";
      html += `
        <div class="bubble outgoing">${firstMove.label}</div>
        <div class="consequence ${state.firstMove === "observe" ? "positive" : "warning"}"><span><b class="label-symbol" aria-hidden="true">↳</b>Conseguenza</span><p>${consequence}</p></div>
        <div class="enemy-intent second"><span><b class="label-symbol" aria-hidden="true">◇</b>Finestra d’azione</span><strong>La pausa tra il terzo e il quarto respiro.</strong><p>La Memoria pulsa: puoi seguire quel ritmo, ma dovrai attraversare l’istante in cui sei morto.</p></div>`;
    }

    if (state.step === 5) {
      html += `
        <div class="story-choices tactical" aria-label="Decisione finale dello scontro">
          <button type="button" data-final-move="memory"><strong>Invoca il ricordo</strong><span>Segui il respiro e agisci nella pausa.</span></button>
          <button type="button" data-final-move="open"><strong>Apri la porta</strong><span>Costringi la presenza a mostrarsi.</span></button>
          <button type="button" data-final-move="run"><strong>Spegni tutto e corri</strong><span>Abbandona la stanza prima del prossimo colpo.</span></button>
        </div>`;
    }

    if (state.step >= 6 && state.finalMove && state.result) {
      const heading = state.finalMove === "memory"
        ? "Ricordi il colpo prima che accada."
        : state.finalMove === "run"
          ? "L’ombra ti sfiora, ma perdi la sua traccia."
          : "La porta si apre. L’ombra era già dentro.";
      const explanation = state.result === "mastered"
        ? "Hai osservato l’intento e usato la Memoria nel momento corretto. Il vantaggio ha superato la vulnerabilità."
        : state.result === "survived"
          ? "La Memoria ti ha salvato, ma senza una lettura completa hai assorbito parte dell’attacco."
          : "Hai reagito alla provocazione. Sopravvivi, ma la presenza ha trasformato la tua paura in una ferita persistente.";
      html += `<div class="battle-resolution ${state.result}"><span>${state.result === "mastered" ? "Scontro dominato" : state.result === "survived" ? "Sei sopravvissuto" : "Sei ferito"}</span><h2>${heading}</h2><p>${explanation}</p>${state.step === 6 ? `<button type="button" data-action="last-message">Leggi l’ultimo messaggio</button>` : ""}</div>`;
    }

    if (state.step >= 7) {
      html += `<div class="bubble incoming">Ora guarda l’uomo con la barba e il cappello nero, subito dietro di te.</div><div class="cliffhanger"><span>Volto riconosciuto</span><strong>Il mittente è nella fotografia.</strong><p>E in questo momento si trova dall’altra parte della porta.</p></div><div class="bubble incoming urgent">Non sono io quello che devi temere.</div>`;
    }

    if (state.step === 7) {
      html += `<button class="feedback-open" type="button" data-action="conclude">Concludi il prologo</button>`;
    }

    if (state.step === 8) {
      html += `
        <form class="prototype-feedback" id="feedback-form">
          <div><span>Fine del prototipo</span><h2>Ci aiuti con cinque risposte?</h2><p>Non chiediamo email. Le risposte servono esclusivamente a valutare questo concept.</p></div>
          <label>Quanto ti sei sentito dentro la storia?<select name="immersionRating" required><option value="" selected disabled>Seleziona 1–5</option><option value="1">1 — Per nulla</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 — Molto</option></select></label>
          <label>Hai compreso perché lo scontro ha avuto quell’esito?<select name="battleUnderstanding" required><option value="" selected disabled>Seleziona</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label>
          <label>Quale elemento ricordi di più?<select name="memorableElement" required><option value="" selected disabled>Seleziona</option><option value="photo">La fotografia</option><option value="identity">La scelta identitaria</option><option value="memory">La Memoria</option><option value="battle">Lo scontro</option><option value="cliffhanger">Il cliffhanger</option></select></label>
          <label>Vorresti continuare la storia?<select name="wantsContinue" required><option value="" selected disabled>Seleziona</option><option value="yes">Sì</option><option value="maybe">Forse</option><option value="no">No</option></select></label>
          <label>Voto complessivo<select name="overallRating" required><option value="" selected disabled>Seleziona 1–10</option>${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("")}</select></label>
          <label>Commento facoltativo<textarea name="comment" maxlength="500" rows="4" placeholder="Cosa cambieresti?"></textarea></label>
          <p class="feedback-privacy">Dati trattati secondo l’<a href="https://immortal-narrative-m0.dandrea-l.chatgpt.site/privacy" target="_blank" rel="noreferrer">informativa privacy</a>.</p>
          <button type="submit">Invia il feedback</button><p class="form-message ${state.feedbackStatus}" role="status">${state.feedbackMessage}</p>
        </form>`;
    }

    if (state.step === 9) {
      html += `<div class="prototype-thanks"><span>Ricordo archiviato</span><h2>Grazie. Il Caso può continuare.</h2><p>${state.feedbackMessage}</p><a href="https://immortal-narrative-m0.dandrea-l.chatgpt.site/#waitlist">Entra nella lista del primo test →</a></div>`;
    }

    html += `<div id="thread-end"></div>`;
    return html;
  }

  function renderArchive() {
    const identity = selectedIdentity();
    return `
      <div class="archive-label">Archivio personale</div>
      <h1>Identità incompleta</h1>
      <dl>
        <div><dt>Presente</dt><dd>Sconosciuto</dd></div>
        <div><dt>Prima traccia</dt><dd>Parigi, 1891</dd></div>
        <div><dt>Tratto</dt><dd>${identity?.trait.split(" — ")[0] ?? "Non emerso"}</dd></div>
      </dl>
      <div class="archive-memory ${state.step >= 3 ? "equipped" : "locked"}"><span>Slot Memoria</span><strong>${state.step >= 3 ? "Il respiro prima del colpo" : "Vuoto"}</strong><p>${state.step >= 3 ? "+ lettura del ritmo  •  − eco della morte" : "Recupera un frammento del passato"}</p></div>
      <div class="archive-state"><span>Stato</span><strong>${state.result === "wounded" ? "Ferita: Eco della soglia" : state.result ? "Lucidità preservata" : "Nessuna ferita"}</strong></div>
      <p class="archive-note">Questa è una simulazione deterministica M0. Nessuna risposta è generata da IA.</p>`;
  }

  function render() {
    app.innerHTML = `
      <main class="prototype-page">
        <header class="prototype-header">
          <a href="https://immortal-narrative-m0.dandrea-l.chatgpt.site/" class="wordmark">Immortal Narrative</a>
          <div class="prototype-progress" aria-label="Progresso ${Math.min(state.step + 1, 9)} di 9"><span style="width:${Math.min(((state.step + 1) / 9) * 100, 100)}%"></span></div>
          <span class="prototype-time">Prototipo M0 • 10 min</span>
        </header>
        <div class="prototype-shell">
          <section class="story-phone" aria-label="Conversazione interattiva">
            <div class="story-contact"><span class="story-avatar">?</span><div><strong>Numero sconosciuto</strong><small>online</small></div><time>23:17</time></div>
            <div class="story-thread" aria-live="polite">${renderStory()}</div>
          </section>
          <aside class="prototype-archive" aria-label="Scheda del personaggio">${renderArchive()}</aside>
        </div>
      </main>`;

    bindEvents();
    requestAnimationFrame(() => document.querySelector("#thread-end")?.scrollIntoView({ behavior: "smooth", block: "end" }));
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
      emit("prototype_battle_start", { mode: state.mode, identity: state.identity ?? "unknown" });
      render();
    }));
    document.querySelectorAll("[data-first-move]").forEach((button) => button.addEventListener("click", () => {
      state.firstMove = button.dataset.firstMove;
      state.step = 5;
      render();
    }));
    document.querySelectorAll("[data-final-move]").forEach((button) => button.addEventListener("click", () => {
      state.finalMove = button.dataset.finalMove;
      state.result = state.firstMove === "observe" && state.finalMove === "memory"
        ? "mastered"
        : state.finalMove === "memory" || (state.firstMove === "observe" && state.finalMove === "run")
          ? "survived"
          : "wounded";
      state.step = 6;
      emit("prototype_battle_complete", { mode: state.mode ?? "unknown", firstMove: state.firstMove ?? "unknown", finalMove: state.finalMove, result: state.result });
      render();
    }));
    document.querySelector('[data-action="last-message"]')?.addEventListener("click", () => {
      state.step = 7;
      emit("prototype_complete", { mode: state.mode ?? "unknown", identity: state.identity ?? "unknown", result: state.result ?? "unknown" });
      render();
    });
    document.querySelector('[data-action="conclude"]')?.addEventListener("click", () => { state.step = 8; render(); });
    document.querySelector("#feedback-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const record = { ...data, sessionId: sessionId(), mode: state.mode, identity: state.identity, firstMove: state.firstMove, battleResult: state.result, timestamp: new Date().toISOString() };
      try {
        const previous = JSON.parse(localStorage.getItem("immortal-narrative-demo-feedback") || "[]");
        previous.push(record);
        localStorage.setItem("immortal-narrative-demo-feedback", JSON.stringify(previous));
        state.feedbackStatus = "success";
        state.feedbackMessage = "Feedback registrato. Il tuo ricordo resta con noi.";
        state.step = 9;
        emit("prototype_feedback", { wantsContinue: String(data.wantsContinue), battleUnderstanding: String(data.battleUnderstanding), overallRating: String(data.overallRating) });
      } catch {
        state.feedbackStatus = "error";
        state.feedbackMessage = "Invio non riuscito. Riprova.";
      }
      render();
    });
  }

  emit("prototype_start", { source: new URLSearchParams(location.search).get("source") ?? new URLSearchParams(location.search).get("utm_source") ?? "direct", variant: "threshold-memory-v1" });
  render();
})();
