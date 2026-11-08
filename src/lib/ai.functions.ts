import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const counts = (keys: string[]) => z.object(Object.fromEntries(keys.map((k) => [k, z.number().int().min(0).max(8)])));

const BriefSchema = z.object({
  floors: z.number().int().min(1).max(3),
  style: z.enum(["Modern tropical", "Contemporary", "Minimalist", "Colonial", "Traditional Sri Lankan"]),
  budget: z.number().nullable(),
  ground: counts(["living", "dining", "kitchen", "bedroom", "bathroom", "parking", "staircase", "store", "guest", "study"]),
  upper: counts(["master", "bedroom", "attached_bath", "family", "balcony", "study", "prayer", "laundry"]),
  openKitchen: z.boolean(),
  garden: z.boolean(),
  accessibility: z.boolean(),
  privacy: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});
export type AiBrief = z.infer<typeof BriefSchema>;

export const parseBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) => z.object({ text: z.string().trim().min(5).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions:
          "You are an architectural planning assistant for Sri Lankan homes. Convert the customer's description into a structured house brief. Ground floor counts use the ground keys; upper floor counts use the upper keys (all zero if single storey). Include a staircase (1) when floors > 1. Budget in LKR (convert 'lakhs' = 100,000 and 'million'), null if not stated. Always include sensible essentials the customer did not exclude: ground floor living 1, dining 1, kitchen 1, bathroom at least 1; upper floors need at least 1 bathroom or attached bath per 2 bedrooms. Default style Modern tropical. summary: one sentence restating the brief.",
        messages: [{ role: "user", content: data.text }],
        output: Output.object({ schema: BriefSchema }),
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const brief = await result.output;
      return { ok: true as const, brief };
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) return { ok: false as const, error: "AI is busy right now. Please try again in a minute." };
      if (status === 402) return { ok: false as const, error: "AI credits are used up for this workspace." };
      console.error("parseBrief failed", e);
      return { ok: false as const, error: "Could not understand the description. Please use the form instead." };
    }
  });
