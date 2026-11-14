// Response composer (L3, domain-agnostic). Enforces what the platform promises the user
// regardless of which capability answered: the spoken-word budget and discreet mode.
// It never invents domain wording; when it must cut, it falls back to a neutral line.
import type { DomainResponse, LText } from "../contracts.ts";

const NEUTRAL: LText = { en: "I've put the details on your phone.", fi: "Tiedot ovat puhelimessasi." };

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const neutral = (locale: string) => (locale.startsWith("fi") ? NEUTRAL.fi! : NEUTRAL.en!);

export interface OutputConstraints { speechMaxWords: number; discreetMode: boolean; locale: string }

export function composeSpeech(response: DomainResponse, c: OutputConstraints): DomainResponse {
  let text = response.speech.text;
  let epistemic = response.speech.epistemic;

  // Discreet mode: no amounts or other figures in the user's ear (open-ear speakers).
  if (c.discreetMode && /\d/.test(text)) {
    text = neutral(c.locale);
    epistemic = "fact";
  }

  // Speech budget: keep whole sentences that fit; otherwise the neutral line.
  if (wordCount(text) > c.speechMaxWords) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    let kept = "";
    for (const s of sentences) {
      const next = `${kept} ${s.trim()}`.trim();
      if (wordCount(next) > c.speechMaxWords) break;
      kept = next;
    }
    text = kept || neutral(c.locale);
  }

  return text === response.speech.text ? response : { ...response, speech: { text, epistemic } };
}
