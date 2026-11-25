/**
 * SimulaMax PCMA - Application Engine
 * Handles 500 Shuffled Questions Across 10 Gamified Levels (50 Qs per Level)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    selectedSubject: "all",
    shuffledQuestions: [],
    currentLevel: 1, // 1 to 10
    maxUnlockedLevel: 1, // 1 to 10
    questionsPerLevel: 50,
    currentIndexInLevel: 0, // 0 to 49
    userAnswers: {}, // questionId -> optionIndex
    xp: 0,
    streak: 0,
    maxStreak: 0,
    highScorePct: 0, // Maior Nota (%)
    elapsedSeconds: 0,
    timerRunning: true,
    subjectCorrect: {},
    unlockedTrophies: new Set()
  };

  let timerInterval = null;

  // DOM Elements
  const el = {
    categoryBar: document.getElementById("category-bar"),
    levelDisplay: document.getElementById("level-display"),
    xpDisplay: document.getElementById("xp-display"),
    streakDisplay: document.getElementById("streak-display"),
    highScoreDisplay: document.getElementById("high-score-display"),
    timerWidget: document.getElementById("timer-widget"),
    timerDisplay: document.getElementById("timer-display"),
    btnTimerToggle: document.getElementById("btn-timer-toggle"),
    btnTimerReset: document.getElementById("btn-timer-reset"),
    trophyCount: document.getElementById("trophy-count"),
    btnTrophies: document.getElementById("btn-trophies"),
    btnSound: document.getElementById("btn-sound"),
    soundIcon: document.getElementById("sound-icon"),
    
    // Level & Progress Elements
    levelPillsContainer: document.getElementById("level-pills-container"),
    levelProgressTitle: document.getElementById("level-progress-title"),
    levelProgressPct: document.getElementById("level-progress-pct"),
    levelProgressFill: document.getElementById("level-progress-fill"),

    // Buttons
    btnRestartHeader: document.getElementById("btn-restart-header"),
    btnRestartCard: document.getElementById("btn-restart-card"),
    btnRestartFooter: document.getElementById("btn-restart-footer"),
    btnViewResults: document.getElementById("btn-view-results"),
    btnTips: document.getElementById("btn-tips"),
    btnQuestionHint: document.getElementById("btn-question-hint"),
    gridTitle: document.getElementById("grid-title"),

    // Quiz Card
    floatingCard: document.getElementById("floating-card"),
    subjectBadge: document.getElementById("subject-badge"),
    diffBadge: document.getElementById("diff-badge"),
    qNumber: document.getElementById("q-number"),
    questionText: document.getElementById("question-text"),
    optionsList: document.getElementById("options-list"),
    didacticHintBox: document.getElementById("didactic-hint-box"),
    commentaryBox: document.getElementById("commentary-box"),
    commentaryText: document.getElementById("commentary-text"),
    
    // Nav & Controls
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    navGrid: document.getElementById("nav-grid"),
    
    // Tips & Trophy Modals
    tipsModal: document.getElementById("tips-modal"),
    closeTipsModal: document.getElementById("close-tips-modal"),
    trophyModal: document.getElementById("trophy-modal"),
    trophyGrid: document.getElementById("trophy-grid"),
    closeTrophyModal: document.getElementById("close-trophy-modal"),

    // Level Up Modal
    levelupModal: document.getElementById("levelup-modal"),
    levelupIcon: document.getElementById("levelup-icon"),
    levelupTitle: document.getElementById("levelup-title"),
    levelupDesc: document.getElementById("levelup-desc"),
    levelupScoreVal: document.getElementById("levelup-score-val"),
    btnNextLevel: document.getElementById("btn-next-level"),
    
    // Results & High Score Modal
    resultsModal: document.getElementById("results-modal"),
    closeResultsModal: document.getElementById("close-results-modal"),
    finalScorePct: document.getElementById("final-score-pct"),
    finalScoreRatio: document.getElementById("final-score-ratio"),
    newRecordBanner: document.getElementById("new-record-banner"),
    finalHighScoreVal: document.getElementById("final-high-score-val"),
    breakdownList: document.getElementById("breakdown-list"),
    btnRestartModal: document.getElementById("btn-restart-modal"),

    toastNotification: document.getElementById("toast-notification"),
    toastIcon: document.getElementById("toast-icon"),
    toastTitle: document.getElementById("toast-title"),
    toastDesc: document.getElementById("toast-desc"),
    
    confettiCanvas: document.getElementById("confetti-canvas")
  };

  // Helper: Fisher-Yates Array Shuffle
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Initialize Data & Storage
  function init() {
    loadSavedState();
    if (state.shuffledQuestions.length === 0) {
      state.shuffledQuestions = shuffleArray([...questionsData]);
    }
    renderCategories();
    renderLevelPills();
    renderQuestion();
    renderTrophies();
    setupEventListeners();
    startTimer();
  }

  function formatTimer(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = n => String(n).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  }

  function updateTimerUI() {
    if (el.timerDisplay) el.timerDisplay.textContent = formatTimer(state.elapsedSeconds);
    if (el.btnTimerToggle) el.btnTimerToggle.textContent = state.timerRunning ? "⏸️" : "▶️";
    if (el.timerWidget) el.timerWidget.classList.toggle("paused", !state.timerRunning);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerUI();
    timerInterval = setInterval(() => {
      if (state.timerRunning) {
        state.elapsedSeconds++;
        updateTimerUI();
        if (state.elapsedSeconds % 5 === 0) saveState();
      }
    }, 1000);
  }

  function loadSavedState() {
    const saved = localStorage.getItem("simulamax_pcma_state_v3_pdf500");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.xp = parsed.xp || 0;
        state.streak = parsed.streak || 0;
        state.maxStreak = parsed.maxStreak || 0;
        state.highScorePct = parsed.highScorePct || 0;
        state.elapsedSeconds = parsed.elapsedSeconds || 0;
        state.currentLevel = parsed.currentLevel || 1;
        state.maxUnlockedLevel = parsed.maxUnlockedLevel || 1;
        state.subjectCorrect = parsed.subjectCorrect || {};
        state.userAnswers = parsed.userAnswers || {};
        if (parsed.shuffledQuestionIds) {
          // Re-map saved shuffled order
          state.shuffledQuestions = parsed.shuffledQuestionIds.map(id => questionsData.find(q => q.id === id)).filter(Boolean);
        }
        if (parsed.unlockedTrophies) {
          state.unlockedTrophies = new Set(parsed.unlockedTrophies);
        }
      } catch (e) {
        console.error("Error loading state:", e);
      }
    }
    updateStatsUI();
  }

  function saveState() {
    const toSave = {
      xp: state.xp,
      streak: state.streak,
      maxStreak: state.maxStreak,
      highScorePct: state.highScorePct,
      elapsedSeconds: state.elapsedSeconds,
      currentLevel: state.currentLevel,
      maxUnlockedLevel: state.maxUnlockedLevel,
      subjectCorrect: state.subjectCorrect,
      userAnswers: state.userAnswers,
      shuffledQuestionIds: state.shuffledQuestions.map(q => q.id),
      unlockedTrophies: Array.from(state.unlockedTrophies)
    };
    localStorage.setItem("simulamax_pcma_state_v3_pdf500", JSON.stringify(toSave));
  }

  function updateStatsUI() {
    el.levelDisplay.textContent = `Nível ${state.currentLevel}`;
    el.xpDisplay.textContent = state.xp;
    el.streakDisplay.textContent = state.streak;
    el.highScoreDisplay.textContent = `${state.highScorePct}%`;
    el.trophyCount.textContent = `${state.unlockedTrophies.size}/${trophyDefinitions.length}`;
  }

  // Get Questions for Current Level (50 questions per level)
  function getCurrentLevelQuestions() {
    const startIdx = (state.currentLevel - 1) * state.questionsPerLevel;
    const endIdx = startIdx + state.questionsPerLevel;
    return state.shuffledQuestions.slice(startIdx, endIdx);
  }

  // Render Categories Bar
  function renderCategories() {
    el.categoryBar.innerHTML = "";
    subjectsList.forEach(subj => {
      const btn = document.createElement("button");
      btn.className = `cat-pill ${state.selectedSubject === subj.id ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${subj.name}</span>
        <span class="cat-count">${subj.count}</span>
      `;
      btn.addEventListener("click", () => {
        state.selectedSubject = subj.id;
        state.currentIndexInLevel = 0;
        document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        renderQuestion();
      });
      el.categoryBar.appendChild(btn);
    });
  }

  // Render 10 Level Selector Pills
  function renderLevelPills() {
    el.levelPillsContainer.innerHTML = "";
    for (let l = 1; l <= 10; l++) {
      const isUnlocked = l <= state.maxUnlockedLevel;
      const isActive = l === state.currentLevel;

      const btn = document.createElement("button");
      btn.className = `page-pill ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : 'unlocked'}`;
      btn.innerHTML = `${isUnlocked ? '🎖️' : '🔒'} Nível ${l} ${isUnlocked ? `(${ (l-1)*50 + 1 }-${ l*50 })` : ''}`;

      if (isUnlocked) {
        btn.addEventListener("click", () => {
          state.currentLevel = l;
          state.currentIndexInLevel = 0;
          updateStatsUI();
          renderLevelPills();
          renderQuestion();
        });
      }

      el.levelPillsContainer.appendChild(btn);
    }
  }

  // Render Level Progress Bar
  function updateLevelProgressBar() {
    const levelQs = getCurrentLevelQuestions();
    const answeredInLevel = levelQs.filter(q => state.userAnswers[q.id] !== undefined).length;
    const pct = Math.round((answeredInLevel / levelQs.length) * 100);

    el.levelProgressTitle.textContent = `Progresso no Nível ${state.currentLevel}: ${answeredInLevel} de ${levelQs.length} respondidas`;
    el.levelProgressPct.textContent = `${pct}%`;
    el.levelProgressFill.style.width = `${pct}%`;

    return { answeredInLevel, totalInLevel: levelQs.length };
  }

  // Shuffle & Restart Entire Test
  function restartTest() {
    state.userAnswers = {};
    state.shuffledQuestions = shuffleArray([...questionsData]);
    state.currentLevel = 1;
    state.maxUnlockedLevel = 1;
    state.currentIndexInLevel = 0;
    state.elapsedSeconds = 0;
    state.timerRunning = true;
    updateTimerUI();
    saveState();

    updateStatsUI();
    renderLevelPills();
    renderQuestion();

    audioFX.playStreak();
    showToast("🎲 Simulado Reiniciado!", "Todas as 500 questões foram embaralhadas! Começando do Nível 1.", "🔄");
  }

  // Render Current Question inside Active Level
  function renderQuestion() {
    const levelQs = getCurrentLevelQuestions();
    if (levelQs.length === 0) return;

    if (state.currentIndexInLevel >= levelQs.length) {
      state.currentIndexInLevel = levelQs.length - 1;
    }
    if (state.currentIndexInLevel < 0) {
      state.currentIndexInLevel = 0;
    }

    const q = levelQs[state.currentIndexInLevel];
    const overallNum = (state.currentLevel - 1) * state.questionsPerLevel + state.currentIndexInLevel + 1;
    
    // Reset floating card animation
    el.floatingCard.classList.remove("hover-float");
    el.floatingCard.style.animation = "none";
    el.floatingCard.offsetHeight; // reflow
    el.floatingCard.style.animation = "slideInUpFloat 0.4s ease-out forwards";

    setTimeout(() => {
      el.floatingCard.classList.add("hover-float");
    }, 450);

    // Header info
    el.subjectBadge.textContent = q.subject;
    el.diffBadge.textContent = q.difficulty;
    el.qNumber.textContent = `Questão ${state.currentIndexInLevel + 1} de 50 no Nível ${state.currentLevel} (Nº ${overallNum} de 500)`;

    // Question body
    el.questionText.textContent = q.text;
    if (el.didacticHintBox) {
      el.didacticHintBox.style.display = "none";
      el.didacticHintBox.innerHTML = "";
    }

    // Render options
    el.optionsList.innerHTML = "";
    const answeredIdx = state.userAnswers[q.id];
    const isAnswered = answeredIdx !== undefined;

    q.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      
      const letter = String.fromCharCode(65 + idx);
      
      if (isAnswered) {
        btn.classList.add("disabled");
        if (idx === q.correctIndex) {
          btn.classList.add(idx === answeredIdx ? "selected-correct" : "reveal-correct");
        } else if (idx === answeredIdx) {
          btn.classList.add("selected-wrong");
        }
      }

      btn.innerHTML = `
        <div class="opt-indicator">${letter}</div>
        <span>${optText.replace(/^[A-E]\)\s*/, "")}</span>
      `;

      btn.addEventListener("click", () => {
        if (state.userAnswers[q.id] === undefined) {
          handleSelectOption(q, idx);
        }
      });

      el.optionsList.appendChild(btn);
    });

    // Render Commentary
    if (isAnswered) {
      el.commentaryText.textContent = q.commentary;
      el.commentaryBox.style.display = "block";
    } else {
      el.commentaryBox.style.display = "none";
    }

    // Update Controls
    el.btnPrev.disabled = state.currentIndexInLevel === 0;
    el.btnNext.disabled = state.currentIndexInLevel === levelQs.length - 1;

    updateLevelProgressBar();
    renderNavGrid();
  }

  // Handle Option Selection
  function handleSelectOption(q, selectedIdx) {
    state.userAnswers[q.id] = selectedIdx;
    const isCorrect = selectedIdx === q.correctIndex;

    if (isCorrect) {
      audioFX.playCorrect();
      state.xp += 10;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      // Track subject correct count
      state.subjectCorrect[q.subjectId] = (state.subjectCorrect[q.subjectId] || 0) + 1;

      // Streak sound
      if (state.streak === 5 || state.streak === 10 || state.streak === 25) {
        setTimeout(() => audioFX.playStreak(), 200);
      }
    } else {
      audioFX.playWrong();
      state.streak = 0;
    }

    updateStatsUI();
    evaluateTrophies();
    saveState();
    renderQuestion();

    // Check level completion
    const { answeredInLevel, totalInLevel } = updateLevelProgressBar();
    if (answeredInLevel === totalInLevel) {
      setTimeout(() => triggerLevelUp(), 750);
    }
  }

  // Trigger LEVEL UP Celebration Modal
  function triggerLevelUp() {
    const levelQs = getCurrentLevelQuestions();
    let levelCorrect = 0;
    levelQs.forEach(q => {
      if (state.userAnswers[q.id] === q.correctIndex) levelCorrect++;
    });

    const levelPct = Math.round((levelCorrect / levelQs.length) * 100);

    el.levelupTitle.textContent = `Nível ${state.currentLevel} Concluído! 🎉`;
    el.levelupScoreVal.textContent = `${levelCorrect} de ${levelQs.length} Acertos (${levelPct}%)`;

    // Unlock next level if available
    if (state.currentLevel < 10 && state.maxUnlockedLevel <= state.currentLevel) {
      state.maxUnlockedLevel = state.currentLevel + 1;
      el.levelupDesc.textContent = `Você respondeu a todas as 50 questões do Nível ${state.currentLevel} e DESBLOQUEOU o Nível ${state.maxUnlockedLevel}! 🚀`;
      el.btnNextLevel.style.display = "block";
    } else if (state.currentLevel === 10) {
      el.levelupDesc.textContent = "🏆 INCRÍVEL! Você respondeu a TODAS AS 500 QUESTÕES dos 10 Níveis!";
      el.btnNextLevel.style.display = "none";
    }

    saveState();
    updateStatsUI();
    renderLevelPills();

    audioFX.playTrophyFanfare();
    launchConfetti();
    el.levelupModal.classList.add("active");
  }

  // Render Quick Navigation Grid (50 Questions of current level)
  function renderNavGrid() {
    el.navGrid.innerHTML = "";
    const levelQs = getCurrentLevelQuestions();

    el.gridTitle.textContent = `MAPA DAS 50 QUESTÕES DO NÍVEL ${state.currentLevel}:`;

    levelQs.forEach((q, relIdx) => {
      const overallNum = (state.currentLevel - 1) * state.questionsPerLevel + relIdx + 1;
      const pill = document.createElement("button");
      pill.className = `nav-pill ${relIdx === state.currentIndexInLevel ? 'current' : ''}`;
      
      const ans = state.userAnswers[q.id];
      if (ans !== undefined) {
        if (ans === q.correctIndex) {
          pill.classList.add("answered-correct");
        } else {
          pill.classList.add("answered-wrong");
        }
      }

      pill.textContent = relIdx + 1; // 1 to 50 inside the level
      pill.title = `Questão ${relIdx + 1} (Nº ${overallNum} das 500)`;
      pill.addEventListener("click", () => {
        state.currentIndexInLevel = relIdx;
        renderQuestion();
      });

      el.navGrid.appendChild(pill);
    });
  }

  // Calculate Results & Open Final High Score Modal
  function openResultsModal() {
    const totalAnswered = Object.keys(state.userAnswers).length;
    if (totalAnswered === 0) {
      showToast("Aviso", "Responda ao menos uma questão para ver o relatório!", "ℹ️");
      return;
    }

    let correctCount = 0;
    Object.keys(state.userAnswers).forEach(qid => {
      const q = questionsData.find(item => item.id == qid);
      if (q && state.userAnswers[qid] === q.correctIndex) {
        correctCount++;
      }
    });

    const currentScorePct = Math.round((correctCount / totalAnswered) * 100);
    let isNewRecord = false;

    if (currentScorePct > state.highScorePct) {
      state.highScorePct = currentScorePct;
      isNewRecord = true;
      saveState();
      updateStatsUI();
    }

    // Modal UI values
    el.finalScorePct.textContent = `${currentScorePct}%`;
    el.finalScoreRatio.textContent = `${correctCount} de ${totalAnswered} acertos (${totalAnswered}/500 respondidas)`;
    el.finalHighScoreVal.textContent = `${state.highScorePct}%`;

    if (isNewRecord) {
      el.newRecordBanner.style.display = "block";
      audioFX.playTrophyFanfare();
      launchConfetti();
    } else {
      el.newRecordBanner.style.display = "none";
    }

    // Render Subject Breakdown
    el.breakdownList.innerHTML = "";
    const subjectStats = {};

    questionsData.forEach(q => {
      const ans = state.userAnswers[q.id];
      if (ans !== undefined) {
        if (!subjectStats[q.subject]) {
          subjectStats[q.subject] = { correct: 0, total: 0 };
        }
        subjectStats[q.subject].total++;
        if (ans === q.correctIndex) subjectStats[q.subject].correct++;
      }
    });

    Object.keys(subjectStats).forEach(subj => {
      const s = subjectStats[subj];
      const pct = Math.round((s.correct / s.total) * 100);
      const row = document.createElement("div");
      row.className = "breakdown-item";
      row.innerHTML = `
        <span style="font-weight:700;">${subj}</span>
        <span style="color:var(--accent-cyan); font-weight:800;">${s.correct}/${s.total} (${pct}%)</span>
      `;
      el.breakdownList.appendChild(row);
    });

    el.resultsModal.classList.add("active");
  }

  // Evaluate & Unlock Trophies
  function evaluateTrophies() {
    trophyDefinitions.forEach(trophy => {
      if (state.unlockedTrophies.has(trophy.id)) return;

      let unlock = false;

      switch (trophy.id) {
        case "first_correct":
          if (Object.keys(state.userAnswers).some(qid => {
            const q = questionsData.find(item => item.id == qid);
            return q && state.userAnswers[qid] === q.correctIndex;
          })) {
            unlock = true;
          }
          break;

        case "streak_5":
          if (state.streak >= 5) unlock = true;
          break;

        case "streak_10":
          if (state.streak >= 10) unlock = true;
          break;

        case "page_1_complete":
          const level1Qs = state.shuffledQuestions.slice(0, 50);
          if (level1Qs.every(q => state.userAnswers[q.id] !== undefined)) unlock = true;
          break;

        case "page_5_complete":
          if (Object.keys(state.userAnswers).length >= 250) unlock = true;
          break;

        case "page_10_complete":
          if (Object.keys(state.userAnswers).length >= 500) unlock = true;
          break;

        case "gold_pcma":
          const totalAnswered = Object.keys(state.userAnswers).length;
          if (totalAnswered >= 100) {
            const correctTotal = Object.keys(state.userAnswers).filter(qid => {
              const q = questionsData.find(item => item.id == qid);
              return q && state.userAnswers[qid] === q.correctIndex;
            }).length;
            if (correctTotal / totalAnswered >= 0.8) unlock = true;
          }
          break;
      }

      if (unlock) {
        state.unlockedTrophies.add(trophy.id);
        showToast(`Troféu Desbloqueado: ${trophy.title}!`, trophy.description, trophy.icon);
        audioFX.playTrophyFanfare();
        launchConfetti();
      }
    });

    updateStatsUI();
    renderTrophies();
  }

  // Toast Notification
  function showToast(title, desc, icon = "🏆") {
    el.toastIcon.textContent = icon;
    el.toastTitle.textContent = title;
    el.toastDesc.textContent = desc;

    el.toastNotification.classList.add("active");
    setTimeout(() => {
      el.toastNotification.classList.remove("active");
    }, 4000);
  }

  // Render Current Question Commentary inside Método & Dicas Modal
  function renderTipsCurrentQuestion() {
    const container = document.getElementById("tips-current-question");
    if (!container) return;

    const levelQs = getCurrentLevelQuestions();
    const q = levelQs[state.currentIndexInLevel];
    if (!q) return;

    const hints = analyzeQuestionKeywords(q);
    const isAnswered = state.userAnswers[q.id] !== undefined;

    const answerBlock = isAnswered
      ? `<div class="tips-example" style="border-left-color: var(--accent-cyan); margin-top: 0.5rem;">
           <strong style="color: var(--accent-cyan);">💡 Comentário Oficial da Questão:</strong><br/>
           <span>${q.commentary}</span>
         </div>`
      : `<div class="tips-example" style="border-left-color: var(--accent-gold); margin-top: 0.5rem; color: var(--text-muted);">
           🔒 <strong>Sem spoiler:</strong> A resposta e o comentário oficial desta questão aparecerão após você marcar uma alternativa. Use as palavras-chave abaixo para deduzir!
         </div>`;

    container.innerHTML = `
      <h3>📌 Questão Atual na Tela (${q.subject})</h3>
      <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem; white-space: pre-wrap;">${q.text}</div>
      ${answerBlock}
      <div style="margin-top: 0.65rem; font-size: 0.85rem;">
        <strong style="color: var(--accent-gold);">🔍 Palavras-Chave Detectadas Nesta Questão:</strong>
        <ul style="margin: 0.3rem 0 0 1.1rem; padding: 0;">
          ${hints.map(h => `<li>${h}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  // Analyze keywords for any question (reused by both card hint and modal)
  function analyzeQuestionKeywords(q) {
    const stemLow = q.text.toLowerCase();
    const hints = [];

    if (stemLow.includes("negação") || stemLow.includes("negar")) {
      if (stemLow.includes("existe") || stemLow.includes("algum") || stemLow.includes("pelo menos um")) {
        hints.push("🎯 <strong>Gatilho de Negação (Existencial):</strong> Troque <em>Existe / Algum / Pelo menos um</em> por <strong>Todos</strong> (se tinha <em>não</em>, remova) ou por <strong>Nenhum</strong> (se era afirmativa).");
      } else if (stemLow.includes("nenhum")) {
        hints.push("🎯 <strong>Gatilho de Negação (Nenhum):</strong> Procure a alternativa com <strong>Pelo menos um / Existe</strong> (sem manter o <em>não</em>).");
      } else if (stemLow.includes("todo")) {
        hints.push("🎯 <strong>Gatilho de Negação (Todo):</strong> Nunca troque <em>Todo</em> por <em>Nenhum</em>! Procure <strong>Existe / Algum ... não</strong>.");
      }
    }
    if (stemLow.includes("equival") && stemLow.includes("se ")) {
      hints.push("🎯 <strong>Gatilho de Equivalência (Se... então):</strong> Procure a troca para <strong>\"não P ou Q\"</strong> (sai o <em>Se... então</em>, entra o <strong>\"ou\"</strong>) ou a contrapositiva <strong>\"Se não Q, então não P\"</strong>.");
    }

    // 1b. Portuguese conjunction triggers
    const conjTriggers = [
      { re: /\b(conquanto|embora|ainda que|mesmo que|posto que|malgrado)\b/i, label: "Concessão (ideia de \"embora\" / contraste que não impede a ação)" },
      { re: /\b(porquanto|visto que|já que|uma vez que)\b/i, label: "Causa / Explicação (substitua por \"porque\")" },
      { re: /\b(contanto que|desde que)\b/i, label: "Condição (substitua por \"se\")" },
      { re: /\b(a fim de que|para que)\b/i, label: "Finalidade (substitua por \"para\")" },
      { re: /\b(à medida que|à proporção que)\b/i, label: "Proporção (simultaneidade gradual)" }
    ];
    conjTriggers.forEach(ct => {
      const m = q.text.match(ct.re);
      if (m) {
        hints.push(`🔑 <strong>Palavra-Chave Conectiva (<code>${m[1]}</code>):</strong> Indica <strong>${ct.label}</strong>.`);
      }
    });

    const trapLetters = [];
    const parenLetters = [];
    let longestLet = "";
    let longestLen = -1;

    q.options.forEach((opt, idx) => {
      const letChar = String.fromCharCode(65 + idx);
      const low = opt.toLowerCase();
      if (/\bbits\b|estocástica|menor potencial ofensivo|\bexclusiva\b/.test(low)) {
        trapLetters.push(letChar);
      }
      if (/\([^)]+\)/.test(opt)) {
        parenLetters.push(letChar);
      }
      if (opt.length > longestLen) {
        longestLen = opt.length;
        longestLet = letChar;
      }
    });

    if (trapLetters.length > 0) {
      hints.push(`🚫 <strong>Imã de Erro detectado (${trapLetters.join(", ")}):</strong> Contém termo distrator clássico (<em>bits</em>, <em>estocástica</em>, <em>exclusiva</em> ou <em>menor potencial ofensivo</em>) — taxa de erro de 93% a 100%.`);
    }
    if (parenLetters.length > 0) {
      hints.push(`✅ <strong>Sinal de Precisão (${parenLetters.join(", ")}):</strong> Traz detalhamento entre parênteses <code>(...)</code> (47,1% de taxa de acerto na prova).`);
    }
    if (longestLet) {
      hints.push(`📏 <strong>Alternativa mais completa:</strong> Letra <strong>${longestLet}</strong> (${longestLen} caracteres — a mais longa acerta em 38,9% das questões).`);
    }

    hints.push(`📊 <strong>Desempate estatístico:</strong> Caso fique em dúvida entre duas opções válidas, lembre-se que <strong>B (57,6%)</strong> e <strong>C (22,6%)</strong> concentram 80,2% dos gabaritos.`);
    return hints;
  }

  // Live Didactic Keyword Hint for Current Question
  function toggleDidacticHint() {
    if (!el.didacticHintBox) return;
    if (el.didacticHintBox.style.display === "block") {
      el.didacticHintBox.style.display = "none";
      return;
    }

    const levelQs = getCurrentLevelQuestions();
    const q = levelQs[state.currentIndexInLevel];
    if (!q) return;

    const hints = analyzeQuestionKeywords(q);

    el.didacticHintBox.innerHTML = `
      <div class="didactic-hint-title">💡 Análise Didática de Palavras-Chave (Sem Spoiler)</div>
      <ul class="didactic-hint-list">
        ${hints.map(h => `<li>${h}</li>`).join("")}
      </ul>
    `;
    el.didacticHintBox.style.display = "block";
  }

  // Render Trophy Cabinet
  function renderTrophies() {
    el.trophyGrid.innerHTML = "";
    trophyDefinitions.forEach(t => {
      const isUnlocked = state.unlockedTrophies.has(t.id);
      const card = document.createElement("div");
      card.className = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="trophy-icon">${isUnlocked ? t.icon : '🔒'}</div>
        <div class="trophy-name">${t.title}</div>
        <div class="trophy-desc">${t.description}</div>
        <div class="trophy-tag">${isUnlocked ? t.rarity : 'Bloqueado'}</div>
      `;
      el.trophyGrid.appendChild(card);
    });
  }

  // Setup Event Listeners
  function setupEventListeners() {
    el.btnPrev.addEventListener("click", () => {
      if (state.currentIndexInLevel > 0) {
        state.currentIndexInLevel--;
        renderQuestion();
      }
    });

    el.btnNext.addEventListener("click", () => {
      const levelQs = getCurrentLevelQuestions();
      if (state.currentIndexInLevel < levelQs.length - 1) {
        state.currentIndexInLevel++;
        renderQuestion();
      }
    });

    // Level Up Modal Next Level Button
    if (el.btnNextLevel) {
      el.btnNextLevel.addEventListener("click", () => {
        el.levelupModal.classList.remove("active");
        if (state.currentLevel < 10) {
          state.currentLevel++;
          state.currentIndexInLevel = 0;
          updateStatsUI();
          renderLevelPills();
          renderQuestion();
        }
      });
    }

    // Restart Test Buttons
    if (el.btnRestartHeader) el.btnRestartHeader.addEventListener("click", restartTest);
    if (el.btnRestartCard) el.btnRestartCard.addEventListener("click", restartTest);
    if (el.btnRestartFooter) el.btnRestartFooter.addEventListener("click", restartTest);
    if (el.btnRestartModal) el.btnRestartModal.addEventListener("click", () => {
      el.resultsModal.classList.remove("active");
      restartTest();
    });

    // View Results & Didactic Tips
    if (el.btnViewResults) el.btnViewResults.addEventListener("click", openResultsModal);

    if (el.btnTips && el.tipsModal) {
      el.btnTips.addEventListener("click", () => {
        renderTipsCurrentQuestion();
        el.tipsModal.classList.add("active");
      });
    }
    if (el.closeTipsModal && el.tipsModal) {
      el.closeTipsModal.addEventListener("click", () => {
        el.tipsModal.classList.remove("active");
      });
    }
    if (el.tipsModal) {
      el.tipsModal.addEventListener("click", (e) => {
        if (e.target === el.tipsModal) el.tipsModal.classList.remove("active");
      });
    }
    if (el.btnQuestionHint) {
      el.btnQuestionHint.addEventListener("click", toggleDidacticHint);
    }

    if (el.btnTimerToggle) {
      el.btnTimerToggle.addEventListener("click", () => {
        state.timerRunning = !state.timerRunning;
        updateTimerUI();
      });
    }
    if (el.btnTimerReset) {
      el.btnTimerReset.addEventListener("click", () => {
        state.elapsedSeconds = 0;
        updateTimerUI();
        saveState();
      });
    }

    // Modals
    el.btnTrophies.addEventListener("click", () => {
      renderTrophies();
      el.trophyModal.classList.add("active");
    });

    el.closeTrophyModal.addEventListener("click", () => {
      el.trophyModal.classList.remove("active");
    });

    if (el.closeResultsModal) {
      el.closeResultsModal.addEventListener("click", () => {
        el.resultsModal.classList.remove("active");
      });
    }

    el.trophyModal.addEventListener("click", (e) => {
      if (e.target === el.trophyModal) el.trophyModal.classList.remove("active");
    });

    el.resultsModal.addEventListener("click", (e) => {
      if (e.target === el.resultsModal) el.resultsModal.classList.remove("active");
    });

    // Sound toggle
    el.btnSound.addEventListener("click", () => {
      audioFX.muted = !audioFX.muted;
      el.soundIcon.textContent = audioFX.muted ? "🔇" : "🔊";
    });
  }

  // Canvas Confetti Launcher (Zero external dependencies)
  function launchConfetti() {
    const canvas = el.confettiCanvas;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#fbbf24", "#38bdf8", "#10b981", "#ec4899", "#a855f7"];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.color || Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let animId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.rSpeed;
        p.opacity -= 0.015;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animate();
  }

  init();
});
