(() => {
  "use strict";

  // Legacy validation markers retained for the demo workflow:
  // threshold-memory-v1
  // Ora guarda l’uomo con la barba e il cappello nero, subito dietro di te.
  // Non sono io quello che devi temere.

  const ORIGINAL_PHOTO = "https://immortal-narrative-m0.dandrea-l.chatgpt.site/images/hero-1891-photo.png";

  const identities = [
    { value: "analytical", label: "Cerca la prova", response: "Dimmi come hai ottenuto quella fotografia.", trait: "Analitico" },
    { value: "determined", label: "Affronta la minaccia", response: "Se sai chi sono, dimmi chi mi ha ucciso.", trait: "Determinato" },
    { value: "empathetic", label: "Cerca il legame", response: "Chi sono le persone accanto a me?", trait: "Empatico" },
  ];

  const photoDetails = [
    { value: "face", label: "Il tuo volto", detail: "La persona nella foto ha una cicatrice identica alla tua, nello stesso punto." },
    { value: "date", label: "La data sul retro", detail: "La grafia indica Parigi, 18 novembre 1891. L’inchiostro sembra ancora fresco." },
    { value: "stranger", label: "L’uomo col cappello", detail: "Non guarda l’obiettivo. Sta osservando proprio la persona con il tuo volto." },
  ];

  const memoryTriggers = [
    { value: "breath", label: "Segui il respiro", detail: "Tre inspirazioni brevi. Una pausa. Poi il colpo." },
    { value: "scar", label: "Tocca la cicatrice", detail: "Il dolore arriva prima del ricordo, come se la ferita fosse nuova." },
    { value: "hands", label: "Osserva le mani", detail: "Ricordi dita sporche di polvere da sparo e un anello che non possiedi." },
  ];

  const focusChoices = [
    { value: "glass", label: "Resta sul riflesso", detail: "Controlli il movimento dell’ombra senza voltarti." },
    { value: "door", label: "Controlla la porta", detail: "Segui i colpi e cerchi di capire chi è nel corridoio." },
    { value: "phone", label: "Verifica il telefono", detail: "Cerchi una prova che il mittente stia vedendo la stanza." },
  ];

  const firstTactics = [
    { value: "hold", label: "Trattieni la reazione", detail: "Aspetti che l’ombra riveli il proprio ritmo." },
    { value: "misdirect", label: "Fingi di guardare la porta", detail: "Mostri alla presenza ciò che si aspetta di vedere." },
    { value: "challenge", label: "Parla all’ombra", detail: "La costringi a scegliere se rispondere o attaccare." },
  ];

  const secondTactics = [
    { value: "invoke", label: "Invoca la Memoria", detail: "Attraversi il ricordo della tua morte per anticipare il prossimo movimento." },
    { value: "suppress", label: "Resisti al ricordo", detail: "Proteggi la mente, ma rinunci al vantaggio completo." },
    { value: "bait", label: "Usa la vulnerabilità come esca", detail: "Lasci che la presenza creda di averti paralizzato." },
  ];

  const questions = [
    { value: "identity", label: "Chi sei?", text: "Chi sei, e perché eri con me nel 1891?" },
    { value: "intruder", label: "Chi è entrato?", text: "Se non sei tu la minaccia, chi è entrato nella stanza?" },
    { value: "memory", label: "Chi ha cancellato i ricordi?", text: "Perché non ricordo nessuna delle mie vite?" },
  ];

  const state = {
    step: 0,
    photoDetail: null,
    identity: null,
    memoryTrigger: null,
    memoryAccepted: false,
    mode: null,
    focus: null,
    firstTactic: null,
    secondTactic: null,
    result: null,
    question: null,
    feedbackSaved: false,
  };

  const app = document.querySelector("#app");

  function sessionId() {
    try {
      const key = "immortal-narrative-v4-session";
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
      variant: "threshold-memory-v4-extended-diegetic",
      timestamp: new Date().toISOString(),
      metadata,
    };
    console.info("[Immortal Narrative QA]", detail);
    window.dispatchEvent(new CustomEvent("immortal-narrative:event", { detail }));
  }

  function selected(collection, value) {
    return collection.find((item) => item.value === value);
  }

  function chatBubble(text, { outgoing = false, urgent = false, time = "23:17" } = {}) {
    const classes = ["chat-bubble", outgoing ? "chat-bubble--outgoing" : "", urgent ? "chat-bubble--urgent" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}">${text}<time>${time}</time></div>`;
  }

  function realisticPhoto({ crop = false, caption = "Parigi · 1891", alt = "Fotografia originale del 1891 con una persona identica al protagonista" } = {}) {
    return `<div class="photo-message ${crop ? "photo-message--crop" : ""}"><img src="${ORIGINAL_PHOTO}" alt="${alt}" width="1456" height="1088" loading="eager" decoding="async"><div class="photo-caption"><span>${caption}</span><span>${crop ? "DETTAGLIO" : "FOTO RICEVUTA"}</span></div></div>`;
  }

  function phoneFrame(inner, { contactName = "Numero sconosciuto", time = "23:17" } = {}) {
    return `<div class="phone-wrap"><section class="phone" aria-label="Telefono del protagonista"><div class="phone-status"><span>${time}</span><span>●●● 87%</span></div><div class="phone-contact"><span class="contact-avatar">?</span><div><strong>${contactName}</strong><small>online</small></div><time>${time}</time></div><div class="phone-screen">${inner}</div></section></div>`;
  }

  function phoneConversation() {
    const identity = selected(identities, state.identity);
    const detail = selected(photoDetails, state.photoDetail);
    let html = `<p class="phone-day">Oggi</p>${chatBubble("Sei sveglio?")}${chatBubble("Non aprire la porta.", { urgent: true })}${realisticPhoto()}${chatBubble("Hai già commesso questo errore nel 1891.")}`;

    if (state.step === 0) html += `<button class="phone-action" type="button" data-action="open">Apri la conversazione</button>`;
    if (state.step >= 1) html += chatBubble("Guarda bene la fotografia. Dimmi cosa noti per primo.");
    if (state.step >= 2 && detail) html += chatBubble(detail.label, { outgoing: true, time: "23:18" }) + chatBubble(detail.detail, { time: "23:18" });
    if (state.step >= 3) html += chatBubble("Ora scegli cosa vuoi sapere davvero.", { time: "23:18" });
    if (state.step >= 4 && identity) html += chatBubble(identity.response, { outgoing: true, time: "23:19" }) + chatBubble(identity.value === "analytical" ? "La foto è autentica. La domanda è: perché tu non ricordi di esserci stato?" : identity.value === "determined" ? "Ti hanno ucciso. Ma non è stata la tua ultima morte." : "Uno di loro ha provato a salvarti. L’altro ti ha trovato di nuovo.", { time: "23:19" });
    if (state.step >= 5) html += chatBubble("Tocca il volto nella foto. Il ricordo è ancora lì.", { urgent: true, time: "23:19" });
    if (state.step >= 8) html += chatBubble("Tre colpi. Pausa. Due colpi.", { urgent: true, time: "23:21" }) + chatBubble("Guarda il vetro della finestra. L’uomo col cappello è riflesso dietro di te.", { urgent: true, time: "23:21" });
    return html;
  }

  function presenceMarkup(revealed = false) {
    return `<div class="presence ${revealed ? "presence--revealed" : "presence--shadow"}" aria-label="${revealed ? "Uomo con barba e cappello nero" : "Presenza non riconoscibile"}"><span class="presence-body"></span><span class="presence-head"></span><span class="presence-hat"></span><span class="presence-beard"></span></div>`;
  }

  function miniPhoneMessage() {
    return `<div class="room-phone-mini" aria-label="Messaggio del Numero sconosciuto"><div class="mini-contact"><span aria-hidden="true">?</span><strong>Numero sconosciuto</strong></div>${chatBubble("Guarda il vetro della finestra. L’uomo col cappello è dietro di te.", { urgent: true, time: "23:21" })}</div>`;
  }

  function speech(text, revealed = false) {
    return `<div class="speech ${revealed ? "speech--revealed" : ""}" aria-label="Voce nella stanza">${text}</div>`;
  }

  function roomScene({ revealed = false, speechText = null, showPhone = false, choices = null, context = null } = {}) {
    const advice = state.mode === "story" ? `<div class="context-chip"><span>Suggerimento · Modalità Storia</span><p>${context?.advice || "Confronta ciò che senti con ciò che vedi prima di agire."}</p></div>` : `<div class="context-chip"><span>Segnale osservato</span><p>${context?.signal || "La provenienza del rumore e la posizione dell’ombra non coincidono."}</p></div>`;
    return `<section class="room-stage" aria-label="Stanza e riflesso nella finestra"><div class="room-wall"></div><div class="window"><span class="window-glare"></span>${presenceMarkup(revealed)}</div><p class="atmosphere-line">${context?.atmosphere || "I colpi arrivano dalla porta. Nel vetro, però, l’ombra si muove prima del rumore."}</p>${showPhone ? miniPhoneMessage() : ""}${speechText ? speech(speechText, revealed) : ""}${choices ? `<div class="tactical-tray"><div class="tactical-context"><div class="context-chip"><span>Memoria attiva</span><p>Il respiro prima del colpo: riconosci il ritmo che precede un attacco.</p></div>${advice}</div><div class="tactic-grid">${choices.map((item) => `<button class="tactic-button" type="button" data-${choices === focusChoices ? "focus" : choices === firstTactics ? "first-tactic" : "second-tactic"}="${item.value}"><strong>${item.label}</strong><span>${item.detail}</span></button>`).join("")}</div></div>` : ""}</section>`;
  }

  function choicePanel(kicker, title, items, attribute) {
    return `<section class="narrative-panel"><p class="narrative-kicker">${kicker}</p><h2>${title}</h2><div class="choice-stack">${items.map((item) => `<button class="choice-button" type="button" data-${attribute}="${item.value}"><strong>${item.label}</strong><span>${item.detail || `“${item.response || item.text}”`}</span></button>`).join("")}</div></section>`;
  }

  function flashbackPanel() {
    const trigger = selected(memoryTriggers, state.memoryTrigger);
    return `<section class="narrative-panel flashback-panel"><p class="narrative-kicker">Parigi · 1891</p><h2>Il ricordo non arriva come un’immagine.</h2><div class="flashback-copy"><p>${trigger?.detail || "Il passato si apre come una ferita."}</p><p>Sei in una stanza illuminata a gas. L’uomo col cappello conta i tuoi respiri. Tu sai che il quarto sarà l’ultimo.</p><blockquote>«Non guardare l’arma. Guarda il corpo prima che decida di usarla.»</blockquote></div><article class="memory-card"><div class="memory-seal" aria-hidden="true">1891</div><div><p class="narrative-kicker">Memoria recuperata</p><h3>Il respiro prima del colpo</h3><p class="memory-benefit"><strong>Vantaggio:</strong> riconosci il ritmo che precede un attacco.</p><p class="memory-risk"><strong>Vulnerabilità:</strong> ogni utilizzo ti costringe a rivivere gli ultimi secondi di quella morte.</p><button class="primary-action" type="button" data-action="accept-memory">Accetta la Memoria e la vulnerabilità</button></div></article></section>`;
  }

  function outcomePanel() {
    const result = state.result;
    const title = result === "mastered" ? "Hai trasformato la vulnerabilità in vantaggio." : result === "survived" ? "Hai interrotto l’attacco, ma il ricordo ti ha raggiunto." : "La presenza ha letto la tua paura prima di te.";
    const text = result === "mastered" ? "Lasci che il ricordo ti paralizzi per mezzo secondo. L’ombra avanza proprio allora, convinta di averti spezzato. Ti muovi nella pausa successiva." : result === "survived" ? "Resisti alla visione della tua morte. Perdi parte del ritmo, ma eviti di seguire l’esca della porta." : "Cerchi di proteggerti dal ricordo e dal riflesso insieme. Quando torni a guardare il vetro, l’uomo è già molto più vicino.";
    const why = result === "mastered" ? "Hai letto il primo segnale, mantenuto il controllo e usato consapevolmente anche il costo della Memoria." : result === "survived" ? "Una delle due decisioni era corretta, ma non hai sfruttato pienamente il rapporto tra vantaggio e vulnerabilità." : "Hai reagito a informazioni separate senza costruire una strategia coerente.";
    return `<section class="narrative-panel"><p class="narrative-kicker">Conseguenza</p><h2>${title}</h2><article class="result-card result-card--${result}"><h3>${text}</h3><p class="why"><strong>Perché:</strong> ${why}</p></article><button class="primary-action" type="button" data-action="reveal">Guarda di nuovo il riflesso</button></section>`;
  }

  function answerForQuestion() {
    if (state.question === "identity") return "Mi chiamavano Elias. Nel 1891 ti ho insegnato a sopravvivere. Poi ho contribuito a cancellarti.";
    if (state.question === "intruder") return "Qualcuno che porta il tuo volto, ma non i tuoi ricordi. È già stato te una volta.";
    return "Tu. Hai chiesto che venissero cancellati. Non volevi ricordare ciò che avevi fatto per restare immortale.";
  }

  function renderExperience() {
    if (state.step <= 5) {
      let panel;
      if (state.step === 0) panel = `<section class="narrative-panel"><p class="narrative-kicker">Caso 01</p><h1>Il passato ha trovato il tuo numero.</h1><p class="narrative-copy">Una fotografia impossibile è appena comparsa sul tuo telefono.</p></section>`;
      else if (state.step === 1) panel = choicePanel("La fotografia", "Quale dettaglio osservi per primo?", photoDetails, "photo-detail");
      else if (state.step === 2) panel = `<section class="narrative-panel"><p class="narrative-kicker">Dettaglio osservato</p><h2>${selected(photoDetails, state.photoDetail)?.label}</h2><p class="narrative-copy">${selected(photoDetails, state.photoDetail)?.detail}</p><button class="primary-action" type="button" data-action="continue-identity">Rispondi al mittente</button></section>`;
      else if (state.step === 3) panel = choicePanel("La prima risposta", "Cosa vuoi sapere davvero?", identities, "identity");
      else if (state.step === 4) panel = `<section class="narrative-panel"><p class="narrative-kicker">Tratto emerso · ${selected(identities, state.identity)?.trait}</p><h2>Il mittente conosce il modo in cui reagisci.</h2><p class="narrative-copy">La sua risposta sembra continuare una conversazione iniziata più di un secolo fa.</p><button class="primary-action" type="button" data-action="seek-memory">Tocca il volto nella foto</button></section>`;
      else panel = choicePanel("Il ricordo reagisce", "A quale sensazione permetti di riemergere?", memoryTriggers, "memory-trigger");
      return `<div class="experience">${phoneFrame(phoneConversation())}${panel}</div>`;
    }

    if (state.step === 6) return `<div class="experience experience--solo">${flashbackPanel()}</div>`;
    if (state.step === 7) return `<div class="experience experience--solo">${choicePanel("Assetto pronto", "Quanto aiuto vuoi durante lo scontro?", [
      { value: "story", label: "Modalità Storia", detail: "Ricevi un suggerimento separato, senza modificare regole o risultati." },
      { value: "strategist", label: "Modalità Stratega", detail: "Vedi solo Memoria, segnali e informazioni disponibili." },
    ], "mode")}</div>`;
    if (state.step === 8) return `<div class="experience experience--solo">${roomScene({ speechText: "Non voltarti ancora.", showPhone: true, choices: focusChoices, context: { advice: "Il messaggio indica il vetro; la voce nella stanza ti chiede di non voltarti. Prima verifica se descrivono la stessa minaccia.", signal: "Il telefono e la voce concordano sul non voltarti, ma non sai se appartengono alla stessa persona." } })}</div>`;
    if (state.step === 9) {
      const focus = state.focus === "glass" ? "Resti sul riflesso. L’ombra inclina la testa mezzo secondo prima che la voce riprenda." : state.focus === "door" ? "La maniglia non si muove. I colpi continuano, ma nel vetro l’ombra si avvicina." : "Sul telefono compare la scritta “sta digitando…”, mentre la voce nella stanza parla nello stesso istante.";
      return `<div class="experience experience--solo">${roomScene({ speechText: state.focus === "phone" ? "Adesso sai che non sono io a scriverti." : "Hai ancora il vizio di guardare dove vogliono gli altri.", choices: firstTactics, context: { atmosphere: focus, advice: "Non scegliere ancora come colpire. Decidi prima quale reazione vuoi provocare nella presenza.", signal: focus } })}</div>`;
    }
    if (state.step === 10) return `<div class="experience experience--solo">${roomScene({ speechText: "Lo senti, vero? Il momento in cui sei morto.", choices: secondTactics, context: { atmosphere: "Il ricordo del 1891 invade la stanza. Per un istante il vetro diventa una finestra su un’altra morte.", advice: "La Memoria non offre solo un potere: la vulnerabilità può diventare parte della strategia.", signal: "La presenza avanza quando la visione della morte ti immobilizza." } })}</div>`;
    if (state.step === 11) return `<div class="experience">${roomScene({ speechText: null })}${outcomePanel()}</div>`;
    if (state.step === 12) return `<div class="experience experience--solo"><div class="stage-stack">${roomScene({ revealed: true, speechText: "Non sono io quello che devi temere.", context: { atmosphere: "Il volto nel riflesso diventa nitido: barba, cappello nero, gli stessi occhi della fotografia." } })}<button class="primary-action" type="button" data-action="question">Parla con l’uomo nel riflesso</button></div></div>`;
    if (state.step === 13) return `<div class="experience experience--solo">${choicePanel("Una domanda", "Cosa gli chiedi?", questions, "question-choice")}</div>`;
    if (state.step === 14) return `<div class="experience experience--solo"><div class="stage-stack">${roomScene({ revealed: true, speechText: answerForQuestion(), context: { atmosphere: "Mentre parla, il telefono vibra sul pavimento. Il mittente sta inviando un’altra immagine." } })}<button class="primary-action" type="button" data-action="last-photo">Guarda il telefono</button></div></div>`;
    if (state.step === 15) {
      const finalPhone = `<p class="phone-day">Ora</p>${realisticPhoto({ crop: true, caption: "Parigi · 1891 · dettaglio aggiornato", alt: "Dettaglio realistico della fotografia originale del 1891" })}${chatBubble("La fotografia è cambiata mentre parlavi con lui.", { urgent: true, time: "23:24" })}${chatBubble("Guarda il margine destro. C’è sempre stata una terza persona.", { urgent: true, time: "23:24" })}`;
      return `<div class="experience">${phoneFrame(finalPhone, { time: "23:24" })}<section class="narrative-panel"><p class="narrative-kicker">Cliffhanger</p><h2>La prova era già nella prima fotografia.</h2><p class="narrative-copy">La stessa immagine ora mostra un dettaglio che non avevi visto. Qualcuno ha modificato il passato, oppure la tua memoria del passato.</p><button class="primary-action" type="button" data-action="feedback">Concludi il prologo</button></section></div>`;
    }
    if (state.step === 16 && !state.feedbackSaved) return `<div class="experience experience--solo"><section class="narrative-panel"><p class="narrative-kicker">Fine del prototipo esteso</p><h2>Quattro risposte rapide.</h2><form class="feedback-form" id="feedback-form"><label>Ti è sembrato abbastanza lungo per entrare nella storia?<select name="duration" required><option value="" disabled selected>Seleziona</option><option value="short">Ancora troppo breve</option><option value="right">Durata giusta</option><option value="long">Troppo lungo</option></select></label><label>Hai distinto chiaramente telefono e dialoghi nella stanza?<select name="mediaClarity" required><option value="" disabled selected>Seleziona</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label><label>Hai capito come vantaggio e vulnerabilità hanno influenzato lo scontro?<select name="battleUnderstanding" required><option value="" disabled selected>Seleziona</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label><label>Vorresti continuare la storia?<select name="wantsContinue" required><option value="" disabled selected>Seleziona</option><option value="yes">Sì</option><option value="maybe">Forse</option><option value="no">No</option></select></label><label>Cosa cambieresti?<textarea name="comment" maxlength="700" rows="4" placeholder="Scrivi solo ciò che non ha funzionato"></textarea></label><button type="submit">Salva il feedback</button><p class="feedback-note">La demo salva il feedback soltanto in questo browser.</p></form></section></div>`;
    return `<div class="experience experience--solo"><section class="narrative-panel"><p class="narrative-kicker">Ricordo archiviato</p><h2>Grazie. Il Caso può continuare.</h2><p class="narrative-copy">Il feedback è stato salvato localmente.</p><button class="primary-action" type="button" data-action="restart">Ricomincia</button></section></div>`;
  }

  function resolveOutcome() {
    const strongFocus = state.focus === "glass" || state.focus === "phone";
    const strongFirst = state.firstTactic === "hold" || state.firstTactic === "misdirect";
    if (strongFocus && strongFirst && (state.secondTactic === "invoke" || state.secondTactic === "bait")) return "mastered";
    if ((strongFocus && state.secondTactic !== "suppress") || (strongFirst && state.secondTactic === "invoke")) return "survived";
    return "wounded";
  }

  function render() {
    const totalSteps = 17;
    const progress = Math.min(((state.step + 1) / totalSteps) * 100, 100);
    app.innerHTML = `<main class="prototype" id="prototype"><header class="prototype-header"><a class="wordmark" href="#prototype">Immortal Narrative</a><div class="progress-track" aria-label="Avanzamento"><span style="width:${progress}%"></span></div><span class="prototype-meta">Prototipo esteso v4 · 10–15 min</span></header>${renderExperience()}</main>`;
    bindEvents();
    requestAnimationFrame(() => document.querySelector(".experience")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function advance(step, eventName = null, metadata = {}) {
    state.step = step;
    if (eventName) emit(eventName, metadata);
    render();
  }

  function bindEvents() {
    document.querySelector('[data-action="open"]')?.addEventListener("click", () => advance(1));
    document.querySelectorAll("[data-photo-detail]").forEach((button) => button.addEventListener("click", () => { state.photoDetail = button.dataset.photoDetail; advance(2, "prototype_photo_detail_selected", { detail: state.photoDetail }); }));
    document.querySelector('[data-action="continue-identity"]')?.addEventListener("click", () => advance(3));
    document.querySelectorAll("[data-identity]").forEach((button) => button.addEventListener("click", () => { state.identity = button.dataset.identity; advance(4, "prototype_identity_selected", { identity: state.identity }); }));
    document.querySelector('[data-action="seek-memory"]')?.addEventListener("click", () => advance(5));
    document.querySelectorAll("[data-memory-trigger]").forEach((button) => button.addEventListener("click", () => { state.memoryTrigger = button.dataset.memoryTrigger; advance(6, "prototype_memory_trigger_selected", { trigger: state.memoryTrigger }); }));
    document.querySelector('[data-action="accept-memory"]')?.addEventListener("click", () => { state.memoryAccepted = true; advance(7, "prototype_memory_equipped", { memory: "breath-before-strike" }); });
    document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => { state.mode = button.dataset.mode; advance(8, "prototype_mode_selected", { mode: state.mode }); }));
    document.querySelectorAll("[data-focus]").forEach((button) => button.addEventListener("click", () => { state.focus = button.dataset.focus; advance(9, "prototype_focus_selected", { focus: state.focus }); }));
    document.querySelectorAll("[data-first-tactic]").forEach((button) => button.addEventListener("click", () => { state.firstTactic = button.dataset.firstTactic; advance(10, "prototype_first_tactic_selected", { tactic: state.firstTactic }); }));
    document.querySelectorAll("[data-second-tactic]").forEach((button) => button.addEventListener("click", () => { state.secondTactic = button.dataset.secondTactic; state.result = resolveOutcome(); advance(11, "prototype_battle_complete", { focus: state.focus, firstTactic: state.firstTactic, secondTactic: state.secondTactic, result: state.result }); }));
    document.querySelector('[data-action="reveal"]')?.addEventListener("click", () => advance(12));
    document.querySelector('[data-action="question"]')?.addEventListener("click", () => advance(13));
    document.querySelectorAll("[data-question-choice]").forEach((button) => button.addEventListener("click", () => { state.question = button.dataset.questionChoice; advance(14, "prototype_question_selected", { question: state.question }); }));
    document.querySelector('[data-action="last-photo"]')?.addEventListener("click", () => advance(15, "prototype_complete", { identity: state.identity, mode: state.mode, result: state.result, question: state.question }));
    document.querySelector('[data-action="feedback"]')?.addEventListener("click", () => advance(16));
    document.querySelector("#feedback-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        const key = "immortal-narrative-v4-feedback";
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        items.push({ ...data, photoDetail: state.photoDetail, identity: state.identity, memoryTrigger: state.memoryTrigger, mode: state.mode, focus: state.focus, firstTactic: state.firstTactic, secondTactic: state.secondTactic, result: state.result, question: state.question, timestamp: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        // La demo resta utilizzabile anche se il browser blocca localStorage.
      }
      state.feedbackSaved = true;
      emit("prototype_feedback", { duration: data.duration, mediaClarity: data.mediaClarity, battleUnderstanding: data.battleUnderstanding, wantsContinue: data.wantsContinue });
      advance(17);
    });
    document.querySelector('[data-action="restart"]')?.addEventListener("click", () => {
      Object.assign(state, { step: 0, photoDetail: null, identity: null, memoryTrigger: null, memoryAccepted: false, mode: null, focus: null, firstTactic: null, secondTactic: null, result: null, question: null, feedbackSaved: false });
      emit("prototype_restart");
      render();
    });
  }

  emit("prototype_start", { source: new URLSearchParams(location.search).get("utm_source") ?? "direct" });
  render();
})();