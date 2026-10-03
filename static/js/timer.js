// The countdown and the end chime.
// The countdown is redrawn from the end time, so a slowed-down background tab never drifts.
// The chime is scheduled on the Web Audio clock at the start, so it plays on time even then.

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Calls onTick(msLeft) several times a second and onDone() once at zero. Returns a stop function.
export function startCountdown(endAt, onTick, onDone) {
  let finished = false;
  const stop = () => {
    finished = true;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
  };
  function tick() {
    if (finished) return;
    const left = endAt - Date.now();
    onTick(Math.max(0, left));
    if (left <= 0) {
      stop();
      onDone();
    }
  }
  const timer = setInterval(tick, 250);
  // Returning to a background tab catches up at once, so Teach-back appears as soon as the user is back.
  document.addEventListener("visibilitychange", tick);
  tick();
  return stop;
}

let audio = null;
let chime = null;

// Browsers only allow sound after a click, so the Start click calls this.
export function unlockSound() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") audio.resume();
  } catch {
    audio = null; // no Web Audio: the session still works, just without the chime
  }
}

// Two soft sine tones, about 660 Hz then 880 Hz, 0.4 s each with a gentle fade.
export function scheduleChime(inSeconds) {
  cancelChime();
  if (!audio) return;
  const out = audio.createGain();
  out.gain.value = 0.22;
  out.connect(audio.destination);
  const start = audio.currentTime + inSeconds;
  for (const [frequency, offset] of [[660, 0], [880, 0.4]]) {
    const t = start + offset;
    const tone = audio.createOscillator();
    const envelope = audio.createGain();
    tone.type = "sine";
    tone.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(1, t + 0.04);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    tone.connect(envelope).connect(out);
    tone.start(t);
    tone.stop(t + 0.42);
  }
  chime = out;
}

export function cancelChime() {
  chime?.disconnect();
  chime = null;
}
