import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Signed-in customers send a voice recording; the reply streams the transcript back.
async function verifyUser(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token.split(".").length !== 3) return false;
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } });
  const { data, error } = await supabase.auth.getClaims(token);
  return !error && !!data?.claims?.sub;
}

const json = (status: number, error: string) => Response.json({ error }, { status });

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return json(401, "Please sign in again.");
        const { MAX_AUDIO_BYTES, transcribeAudio } = await import("@/lib/voice/transcribe.server");
        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > MAX_AUDIO_BYTES + 64 * 1024) return json(413, "Recording is too long.");
        let form: FormData;
        try { form = await request.formData(); } catch { return json(400, "Invalid upload."); }
        const file = form.get("file");
        const lang = String(form.get("lang") ?? "en");
        if (!(file instanceof File) || file.size < 2048) return json(400, "Recording was empty.");
        if (file.size > MAX_AUDIO_BYTES) return json(413, "Recording is too long.");
        if (!file.type.startsWith("audio/")) return json(400, "Unexpected file type.");
        const upstream = await transcribeAudio(file, lang, request.signal);
        if (!upstream.ok) console.error("transcribe failed", upstream.status);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "content-type": upstream.headers.get("content-type") ?? "text/event-stream", "cache-control": "no-store" },
        });
      },
    },
  },
});
