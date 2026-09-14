import test from "node:test";
import assert from "node:assert/strict";
import {
  AMBIENT_DUCKED_VOLUME,
  AMBIENT_TRACKS,
  AMBIENT_VOLUME,
  getAmbientVolume,
  getNextAmbientTrackIndex,
} from "./useAmbientMusic";

test("mantém a ordem definida para a playlist ambiente", () => {
  assert.deepEqual(AMBIENT_TRACKS, [
    "/music/ambient/01-winter-wind.mp3",
    "/music/ambient/02-majestic.mp3",
    "/music/ambient/03-lonely-in-the-bar.mp3",
    "/music/ambient/04-just-walk.mp3",
    "/music/ambient/05-space-bird.mp3",
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

test("mantém a música em 16% e reduz para 2% durante a narração", () => {
  assert.equal(AMBIENT_VOLUME, 0.16);
  assert.equal(AMBIENT_DUCKED_VOLUME, 0.02);
  assert.equal(getAmbientVolume(null), 0.16);
  assert.equal(getAmbientVolume("cue"), 0.02);
  assert.equal(getAmbientVolume("speaking"), 0.02);
  assert.equal(getAmbientVolume("displaying"), 0.16);
});
