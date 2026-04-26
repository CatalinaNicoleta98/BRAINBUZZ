import { useEffect } from "react";

function playTone(frequency: number, duration = 0.12, type: OscillatorType = "sine") {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.0001;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.stop(context.currentTime + duration);
  void context.close().catch(() => undefined);
}

export function useGameSounds(trigger: {
  questionId?: string;
  lockedIn?: boolean;
  roundEnded?: boolean;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!trigger.enabled || !trigger.questionId) {
      return;
    }

    playTone(660, 0.16, "triangle");
  }, [trigger.enabled, trigger.questionId]);

  useEffect(() => {
    if (!trigger.enabled || !trigger.lockedIn) {
      return;
    }

    playTone(540, 0.12, "square");
  }, [trigger.enabled, trigger.lockedIn]);

  useEffect(() => {
    if (!trigger.enabled || !trigger.roundEnded) {
      return;
    }

    playTone(420, 0.1, "triangle");
    window.setTimeout(() => playTone(620, 0.15, "triangle"), 90);
  }, [trigger.enabled, trigger.roundEnded]);
}
