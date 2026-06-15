const TOTAL_ROUNDS = 5;
const TRACK_MIN = 16;
const TRACK_MAX = 91;
const CM_RANGE = 60;

const els = {
  playfield: document.querySelector("#playfield"),
  roller: document.querySelector("#roller"),
  painPoint: document.querySelector("#painPoint"),
  lockButton: document.querySelector("#lockButton"),
  buttonLabel: document.querySelector("#buttonLabel"),
  instruction: document.querySelector("#instruction"),
  score: document.querySelector("#score"),
  combo: document.querySelector("#combo"),
  rounds: document.querySelector("#rounds"),
  resultToast: document.querySelector("#resultToast"),
  distanceText: document.querySelector("#distanceText"),
  gradeText: document.querySelector("#gradeText"),
  reactionText: document.querySelector("#reactionText"),
  startPanel: document.querySelector("#startPanel"),
  startButton: document.querySelector("#startButton"),
  endPanel: document.querySelector("#endPanel"),
  replayButton: document.querySelector("#replayButton"),
  shareButton: document.querySelector("#shareButton"),
  finalGrade: document.querySelector("#finalGrade"),
  finalTitle: document.querySelector("#finalTitle"),
  finalSummary: document.querySelector("#finalSummary"),
  bestReaction: document.querySelector("#bestReaction"),
};

let state = {
  playing: false,
  waiting: false,
  painActive: false,
  resolving: false,
  round: 0,
  score: 0,
  combo: 0,
  rollerPosition: TRACK_MIN,
  painPosition: 70,
  painStartedAt: 0,
  startTime: 0,
  painTimer: 0,
  results: [],
  speed: 0.00022,
};

const audio = {
  context: null,
  tone(frequency, duration, type = "sine", volume = 0.04) {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  },
  pain() {
    this.tone(180, 0.12, "sawtooth", 0.025);
    setTimeout(() => this.tone(260, 0.12, "sine", 0.03), 70);
  },
  lock(great) {
    this.tone(great ? 660 : 300, 0.13, "sine", 0.045);
    setTimeout(() => this.tone(great ? 880 : 240, 0.16, "sine", 0.035), 85);
  },
};

function initializeRounds() {
  els.rounds.replaceChildren();
  for (let index = 0; index < TOTAL_ROUNDS; index += 1) {
    const dot = document.createElement("span");
    if (index === 0) dot.className = "current";
    els.rounds.append(dot);
  }
}

function updateRounds() {
  [...els.rounds.children].forEach((dot, index) => {
    dot.className = index < state.round ? "done" : index === state.round ? "current" : "";
  });
}

function rollerLoop(timestamp) {
  if (!state.startTime) state.startTime = timestamp;
  if (state.playing && !state.resolving) {
    const elapsed = timestamp - state.startTime;
    const normalized = (Math.sin(elapsed * state.speed * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    state.rollerPosition = TRACK_MIN + normalized * (TRACK_MAX - TRACK_MIN);
    els.roller.style.top = `${state.rollerPosition}%`;
  }
  requestAnimationFrame(rollerLoop);
}

function randomPainPosition() {
  return 37 + Math.random() * 47;
}

function startGame() {
  clearTimeout(state.painTimer);
  state = {
    ...state,
    playing: true,
    waiting: false,
    painActive: false,
    resolving: false,
    round: 0,
    score: 0,
    combo: 0,
    results: [],
    speed: 0.00022,
    startTime: performance.now(),
  };
  els.score.textContent = "0";
  els.combo.textContent = "x0";
  els.startPanel.classList.remove("is-visible");
  els.endPanel.classList.remove("is-visible");
  els.resultToast.classList.remove("is-visible");
  initializeRounds();
  beginRound();
}

function beginRound() {
  state.waiting = true;
  state.painActive = false;
  state.resolving = false;
  state.speed = 0.00022 + state.round * 0.000018;
  els.playfield.classList.remove("pain-active");
  els.painPoint.classList.remove("is-visible");
  els.lockButton.classList.remove("is-ready");
  els.buttonLabel.textContent = "GET READY";
  els.instruction.textContent = "Watch the body. Wait for the pain signal...";
  els.resultToast.classList.remove("is-visible");
  updateRounds();

  const delay = 900 + Math.random() * 1900;
  state.painTimer = setTimeout(showPain, delay);
}

function showPain() {
  if (!state.playing || state.resolving) return;
  state.waiting = false;
  state.painActive = true;
  state.painPosition = randomPainPosition();
  state.painStartedAt = Date.now();
  els.painPoint.style.top = `${state.painPosition}%`;
  els.painPoint.classList.add("is-visible");
  els.playfield.classList.add("pain-active");
  els.lockButton.classList.add("is-ready");
  els.buttonLabel.textContent = "LOCK THE SPOT";
  els.instruction.textContent = "PAIN DETECTED! LOCK IT NOW";
  audio.pain();
  navigator.vibrate?.([35, 25, 35]);
}

function falseStart() {
  if (!state.waiting || state.resolving) return;
  clearTimeout(state.painTimer);
  state.combo = 0;
  state.score = Math.max(0, state.score - 80);
  els.combo.textContent = "x0";
  els.score.textContent = state.score;
  els.instruction.textContent = "TOO EARLY! -80 POINTS";
  els.gradeText.textContent = "TOO EARLY";
  els.gradeText.style.color = "#ff6b5f";
  els.distanceText.textContent = "NO PAIN SIGNAL YET";
  els.reactionText.textContent = "Stay focused and watch the body";
  els.resultToast.classList.add("is-visible");
  state.resolving = true;
  audio.lock(false);
  setTimeout(() => {
    state.resolving = false;
    beginRound();
  }, 900);
}

function lockPainPoint() {
  if (!state.playing) return;
  if (state.waiting) {
    falseStart();
    return;
  }
  if (!state.painActive || state.resolving) return;

  state.resolving = true;
  state.painActive = false;
  const reaction = Date.now() - state.painStartedAt;
  const reactionForScore = Math.min(reaction, 3000);
  const reactionLabel = reaction > 3000 ? "3000+ ms" : `${reaction} ms`;
  const percentageError = Math.abs(state.rollerPosition - state.painPosition);
  const cmError = percentageError / (TRACK_MAX - TRACK_MIN) * CM_RANGE;
  const result = scoreResult(cmError, reactionForScore, reaction > 3000);

  state.combo = result.grade === "MISS" ? 0 : state.combo + 1;
  const comboBonus = Math.min(state.combo, 5) * 30;
  const gained = result.points + comboBonus;
  state.score += gained;
  state.results.push({ cmError, reaction: reactionForScore, grade: result.grade, points: gained });

  els.score.textContent = state.score;
  els.combo.textContent = `x${state.combo}`;
  els.distanceText.textContent = `ERROR ${cmError.toFixed(1)} cm`;
  els.gradeText.textContent = result.grade;
  els.gradeText.style.color = result.color;
  els.reactionText.textContent = `REACTION ${reactionLabel} · +${gained} PTS`;
  els.resultToast.classList.add("is-visible");
  els.roller.classList.add("is-locked");
  els.lockButton.classList.remove("is-ready");
  els.buttonLabel.textContent = "CAPTURED";
  els.instruction.textContent = result.message;
  els.playfield.classList.remove("pain-active");
  audio.lock(result.grade === "PERFECT" || result.grade === "GREAT");
  navigator.vibrate?.(result.grade === "PERFECT" ? [25, 30, 60] : 35);

  setTimeout(() => els.roller.classList.remove("is-locked"), 380);
  setTimeout(nextRound, 1150);
}

function scoreResult(cmError, reaction, timedOut = false) {
  if (timedOut) {
    return { grade: "MISS", points: 60, color: "#ff6b5f", message: "TOO SLOW. RESET AND CATCH THE NEXT SIGNAL" };
  }
  const reactionBonus = Math.max(0, 280 - Math.floor(reaction / 3));
  if (cmError <= 2) {
    return { grade: "PERFECT", points: 720 + reactionBonus, color: "#18d6c5", message: "EXACT CAPTURE! PAIN POINT RECORDED" };
  }
  if (cmError <= 6) {
    return { grade: "GREAT", points: 500 + reactionBonus, color: "#45a3ff", message: "VERY CLOSE! GO EVEN FASTER" };
  }
  if (cmError <= 12) {
    return { grade: "GOOD", points: 280 + reactionBonus, color: "#ffd166", message: "CAPTURED! FINE-TUNE YOUR AIM" };
  }
  return { grade: "MISS", points: 80, color: "#ff6b5f", message: "MISSED THE SPOT. FOCUS ON THE NEXT SIGNAL" };
}

function nextRound() {
  state.round += 1;
  if (state.round >= TOTAL_ROUNDS) {
    finishGame();
  } else {
    beginRound();
  }
}

function finishGame() {
  state.playing = false;
  state.resolving = false;
  clearTimeout(state.painTimer);
  els.painPoint.classList.remove("is-visible");
  els.playfield.classList.remove("pain-active");

  const averageError = state.results.reduce((sum, item) => sum + item.cmError, 0) / state.results.length;
  const best = Math.min(...state.results.map((item) => item.reaction));
  const rank = rankResult(state.score, averageError);
  els.finalGrade.textContent = rank.grade;
  els.finalGrade.style.color = rank.color;
  els.finalTitle.textContent = rank.title;
  els.finalSummary.textContent = `Score ${state.score} · Average error ${averageError.toFixed(1)} cm`;
  els.bestReaction.textContent = `${best} ms`;
  els.endPanel.classList.add("is-visible");
}

function rankResult(score, error) {
  if (score >= 4000 && error <= 5) return { grade: "S", title: "PAIN POINT MASTER", color: "#18d6c5" };
  if (score >= 3000 && error <= 9) return { grade: "A", title: "PRECISION EXPERT", color: "#45a3ff" };
  if (score >= 2000) return { grade: "B", title: "QUICK REFLEXES", color: "#ffd166" };
  return { grade: "C", title: "ONE MORE ROUND", color: "#ff8c7b" };
}

async function shareScore() {
  const text = `I scored ${state.score} in RoboRoll's Capture the Pain Point challenge. Can you lock onto the spot faster?`;
  const shareUrl = `${location.origin}/roboroll-l1/#pain-catcher`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Capture the Pain Point | RoboRoll", text, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      els.shareButton.textContent = "SCORE COPIED";
      setTimeout(() => { els.shareButton.textContent = "SHARE SCORE"; }, 1300);
    }
  } catch (error) {
    if (error.name !== "AbortError") console.error(error);
  }
}

function handleAction(event) {
  if (event?.type === "keydown") {
    if (event.code !== "Space" && event.code !== "Enter") return;
    event.preventDefault();
  }
  if (els.startPanel.classList.contains("is-visible")) {
    startGame();
  } else if (!els.endPanel.classList.contains("is-visible")) {
    lockPainPoint();
  }
}

els.startButton.addEventListener("click", startGame);
els.lockButton.addEventListener("click", handleAction);
els.playfield.addEventListener("pointerdown", handleAction);
els.replayButton.addEventListener("click", startGame);
els.shareButton.addEventListener("click", shareScore);
window.addEventListener("keydown", handleAction);

initializeRounds();
requestAnimationFrame(rollerLoop);
