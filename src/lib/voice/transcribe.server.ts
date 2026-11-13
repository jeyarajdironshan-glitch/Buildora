// Server-only: forwards a recorded clip to Lovable AI speech-to-text.
const BASE_URL = "https://ai.gateway.lovable.dev";
const MODEL = "openai/gpt-transcribe";
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const LANG_CODES = ["en", "si", "ta"] as const;

export async function transcribeAudio(file: File, lang: string, signal?: AbortSignal) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const form = new FormData();
  form.append("model", MODEL);
  form.append("file", file, file.name || "recording.wav");
  form.append("response_format", "json");
  form.append("stream", "true");
  // Hint the expected languages: the chosen site language first, then the other two.
  const first = (LANG_CODES as readonly string[]).includes(lang) ? lang : "en";
  for (const l of [first, ...LANG_CODES.filter((x) => x !== first)]) form.append("languages[]", l);
  form.append("prompt", "A Sri Lankan homeowner describing the house they want: floors, bedrooms, kitchen, parking, budget in lakhs or crore.");
  return fetch(`${BASE_URL}/v1/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    ...(signal ? { signal } : {}),
  });
}
