import test from "node:test";
import assert from "node:assert/strict";
import { AnnouncementQueue, type AnnouncementPhase } from "./announcementQueue";

class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;

  constructor(readonly text: string) {}
}

const waitUntil = async (condition: () => boolean, timeoutMs = 500) => {
  const startedAt = Date.now();
  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error("Condição de teste não atendida");
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

function installSpeechEnvironment() {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  const spoken: FakeUtterance[] = [];
  let cancelCalls = 0;
  let pauseCalls = 0;
  let resumeCalls = 0;
  let visibilityState: "visible" | "hidden" = "visible";
  let visibilityListener: (() => void) | null = null;

  const synth = {
    getVoices: () => [{ lang: "pt-BR" }],
    speak: (utterance: FakeUtterance) => spoken.push(utterance),
    cancel: () => { cancelCalls += 1; },
    pause: () => { pauseCalls += 1; },
    resume: () => { resumeCalls += 1; },
  };
  const fakeDocument = {
    get visibilityState() { return visibilityState; },
    addEventListener: (name: string, listener: () => void) => {
      if (name === "visibilitychange") visibilityListener = listener;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { speechSynthesis: synth },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: FakeUtterance,
  });

  const restoreProperty = (name: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  };

  return {
    spoken,
    get cancelCalls() { return cancelCalls; },
    get pauseCalls() { return pauseCalls; },
    get resumeCalls() { return resumeCalls; },
    setVisibility(next: "visible" | "hidden") {
      visibilityState = next;
      visibilityListener?.();
    },
    restore() {
      restoreProperty("window", originalWindow);
      restoreProperty("document", originalDocument);
      restoreProperty("SpeechSynthesisUtterance", originalUtterance);
    },
  };
}

test("processa anúncios em FIFO sem interromper o item ativo", async () => {
  const queue = new AnnouncementQueue();
  const completed: string[] = [];
  const phases = new Map<string, AnnouncementPhase[]>();

  await new Promise<void>((resolve) => {
    for (const id of ["first", "second"]) {
      phases.set(id, []);
      queue.enqueue({
        id,
        text: "",
        minimumDisplayMs: 0,
        gapAfterMs: 0,
        onPhase: (phase) => phases.get(id)!.push(phase),
        onComplete: (reason) => {
          completed.push(`${id}:${reason}`);
          if (id === "second") resolve();
        },
      });
    }
  });

  assert.deepEqual(completed, ["first:completed", "second:completed"]);
  assert.deepEqual(phases.get("first"), ["waiting", "cue", "speaking", "displaying"]);
  assert.deepEqual(phases.get("second"), ["waiting", "cue", "speaking", "displaying"]);
  assert.equal(queue.getSnapshot().isBusy, false);
});

test("rejeita IDs duplicados e cancela item pendente sem afetar o ativo", async () => {
  const queue = new AnnouncementQueue();
  const reasons: string[] = [];

  queue.enqueue({
    id: "active",
    text: "",
    minimumDisplayMs: 30,
    gapAfterMs: 0,
    onComplete: (reason) => reasons.push(`active:${reason}`),
  });
  assert.equal(queue.enqueue({ id: "active", text: "duplicado" }), false);

  queue.enqueue({
    id: "pending",
    text: "",
    onComplete: (reason) => reasons.push(`pending:${reason}`),
  });
  assert.equal(queue.cancel("pending", "dismissed"), true);

  await new Promise((resolve) => setTimeout(resolve, 45));
  assert.deepEqual(reasons, ["pending:cancelled", "active:completed"]);
});

test("enfileirar outro aviso não corta a fala e a visibilidade pausa e retoma", async (t) => {
  const speech = installSpeechEnvironment();
  t.after(() => speech.restore());
  const queue = new AnnouncementQueue();
  let completed = 0;

  queue.enqueue({
    id: "spoken-first",
    text: "Primeiro aviso completo",
    minimumDisplayMs: 0,
    gapAfterMs: 0,
    onComplete: () => { completed += 1; },
  });
  await waitUntil(() => speech.spoken.length === 1);

  queue.enqueue({
    id: "spoken-second",
    text: "Segundo aviso completo",
    minimumDisplayMs: 0,
    gapAfterMs: 0,
    onComplete: () => { completed += 1; },
  });
  assert.equal(speech.cancelCalls, 0);
  assert.equal(speech.spoken.length, 1);

  speech.setVisibility("hidden");
  speech.setVisibility("visible");
  assert.equal(speech.pauseCalls, 1);
  assert.equal(speech.resumeCalls, 1);

  speech.spoken[0].onend?.();
  await waitUntil(() => speech.spoken.length === 2);
  assert.equal(speech.cancelCalls, 0);

  speech.spoken[1].onend?.();
  await waitUntil(() => completed === 2);
  assert.equal(queue.getSnapshot().isBusy, false);
});

test("mute explícito cancela somente a voz e preserva o tempo mínimo do card", async (t) => {
  const speech = installSpeechEnvironment();
  t.after(() => speech.restore());
  const queue = new AnnouncementQueue();
  const startedAt = Date.now();
  let completedAt = 0;

  queue.enqueue({
    id: "muted-active",
    text: "Aviso que será silenciado",
    minimumDisplayMs: 35,
    gapAfterMs: 0,
    onComplete: () => { completedAt = Date.now(); },
  });
  await waitUntil(() => speech.spoken.length === 1);
  queue.setMuted(true);

  assert.equal(speech.cancelCalls, 1);
  assert.equal(queue.getSnapshot().isBusy, true);
  await waitUntil(() => completedAt > 0);
  assert.ok(completedAt - startedAt >= 30);
});
