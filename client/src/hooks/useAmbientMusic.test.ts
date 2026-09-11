import test from "node:test";
import assert from "node:assert/strict";
import {
  AMBIENT_TRACKS,
  AMBIENT_VOLUME,
  getNextAmbientTrackIndex,
} from "./useAmbientMusic";

test("mantém a ordem definida para a playlist ambiente", () => {
  assert.deepEqual(AMBIENT_TRACKS, [
    "/music/ambient/01-drawbar.mp3",
    "/music/ambient/02-session.mp3",
    "/music/ambient/03-tinfoil.mp3",
    "/music/ambient/04-wake.mp3",
    "/music/ambient/05-jornada-del-muerto.mp3",
  ]);
});

test("reinicia a playlist ambiente depois da quinta faixa", () => {
  const playedIndexes: number[] = [];
  let currentIndex = 0;

  for (let count = 0; count < AMBIENT_TRACKS.length + 1; count += 1) {
    playedIndexes.push(currentIndex);
    currentIndex = getNextAmbientTrackIndex(currentIndex);
  }

  assert.deepEqual(playedIndexes, [0, 1, 2, 3, 4, 0]);
});

test("preserva o volume ambiente em 16%", () => {
  assert.equal(AMBIENT_VOLUME, 0.16);
});
