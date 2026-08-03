(() => {
  "use strict";

  const state = {
    identity: null,
    memoryEquipped: false,
    mode: null,
    tactic: null,
    outcome: null,
  };

  const scenes = [...document.querySelectorAll(".scene")];
  const progress = document.querySelector("#progress");
  const progressLabel = document.querySelector("#progress-label");
  const storyAdvice = document.querySelector("#story-advice");
  const outcomeContainer = document.querySelector("#outcome");

  function emit(name, detail = {}) {
    const payload = {
      name,
      variant: "threshold-memory-v2-semantic-ui",
      timestamp: new Date().toISOString(),
      ...detail,
    };

    console.info("[Immortal Narrative]", payload);
    window.dispatchEvent(new CustomEvent("immortal-narrative:event", { detail: payload }));
  }

  function showStep(step) {
    scenes.forEach((scene) => {
      const isCurrent = Number(scene.dataset.step) === step;
      scene.hidden = !isCurrent;
      scene.classList.toggle("is-active", isCurrent);
    });

    progress.value = step;
    progressLabel.textContent = step === 0 ? "Inizio" : `Passaggio ${step} di 7`;

    const current = scenes.find((scene) => Number(scene.dataset.step) === step);
    if (current) {
      current.scrollIntoView({ behavior: "smooth", block: "start" });
      const title = current.querySelector("h2");
      if (title) {
        title.setAttribute("tabindex", "-1");
        title.focus({ preventScroll: true });
      }
    }
  }

  function resetState() {
    state.identity = null;
    state.memoryEquipped = false;
    state.mode = null;
    state.tactic = null;
    state.outcome = null;
    storyAdvice.hidden = true;
    outcomeContainer.replaceChildren();
    showStep(0);
    emit("prototype_start");
  }

  function renderOutcome(tactic) {
    const outcomes = {
      observe: {
        kind: "success",
        heading: "Hai spezzato l’inganno",
        text: "Resti immobile e segui il ritmo percepito dalla Memoria. La maniglia continua a muoversi, ma la porta non si apre: era il riflesso a imitare il movimento.",
        cause: "Hai confrontato il segnale con l’intento della presenza e non hai reagito alla falsa provenienza del rumore.",
        code: "dominated",
      },
      turn: {
        kind: "partial",
        heading: "Sei sopravvissuto, ma hai perso il vantaggio",
        text: "Ti volti. Alle tue spalle non c’è nessuno. Quando torni a guardare il vetro, l’uomo è più vicino e la Memoria pulsa come una ferita.",
        cause: "Hai individuato correttamente la direzione del pericolo, ma hai reagito prima di verificare il segnale.",
        code: "survived",
      },
      open: {
        kind: "danger",
        heading: "La presenza ti ha costretto a reagire",
        text: "Apri la porta. Il corridoio è vuoto, ma nel vetro il tuo riflesso porta una ferita che sul tuo corpo non esiste ancora.",
        cause: "Hai seguito il rumore, esattamente come voleva la presenza, ignorando la contraddizione mostrata dal riflesso.",
        code: "wounded",
      },
    };

    const result = outcomes[tactic];
    state.outcome = result.code;

    const article = document.createElement("article");
    article.className = `outcome-card outcome-card--${result.kind}`;

    const label = document.createElement("p");
    label.className = "content-label";
    label.textContent = "⚙ SISTEMA · ESITO DELLA SCELTA";

    const heading = document.createElement("h3");
    heading.textContent = result.heading;

    const text = document.createElement("p");
    text.textContent = result.text;

    const cause = document.createElement("p");
    cause.className = "cause";
    cause.innerHTML = `<strong>Perché:</strong> ${result.cause}`;

    article.append(label, heading, text, cause);
    outcomeContainer.replaceChildren(article);
  }

  document.querySelectorAll("[data-identity]").forEach((button) => {
    button.addEventListener("click", () => {
      state.identity = button.dataset.identity;
      emit("prototype_identity_selected", { identity: state.identity });
      showStep(1);
    });
  });

  document.querySelector("#equip-memory").addEventListener("click", () => {
    state.memoryEquipped = true;
    emit("prototype_memory_equipped", { memory: "il-respiro-prima-del-colpo" });
    showStep(2);
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      storyAdvice.hidden = state.mode !== "storia";
      emit("prototype_mode_selected", { mode: state.mode });
      showStep(3);
    });
  });

  document.querySelector("#begin-battle").addEventListener("click", () => {
    emit("prototype_battle_start", {
      identity: state.identity,
      mode: state.mode,
      memoryEquipped: state.memoryEquipped,
    });
    showStep(4);
  });

  document.querySelectorAll("[data-tactic]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tactic = button.dataset.tactic;
      renderOutcome(state.tactic);
      emit("prototype_battle_complete", {
        tactic: state.tactic,
        outcome: state.outcome,
        mode: state.mode,
      });
      showStep(5);
    });
  });

  document.querySelector("#continue-after-outcome").addEventListener("click", () => showStep(6));

  document.querySelector("#finish").addEventListener("click", () => {
    emit("prototype_complete", {
      identity: state.identity,
      mode: state.mode,
      tactic: state.tactic,
      outcome: state.outcome,
    });
    showStep(7);
  });

  document.querySelector("#restart").addEventListener("click", resetState);

  resetState();
})();