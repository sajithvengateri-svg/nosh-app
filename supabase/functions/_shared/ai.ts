/**
 * Shared AI helper for Supabase Edge Functions.
 * Shared AI helper — direct provider APIs (Gemini, OpenAI, Anthropic).
 * Default provider: Gemini (Google). Also supports OpenAI and Anthropic.
 */

export type Provider = "gemini" | "openai" | "anthropic";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | MessagePart[];
}

export interface MessagePart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface ToolFunction {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AIChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  tools?: ToolFunction[];
  tool_choice?: { type: string; function: { name: string } };
  response_format?: { type: string };
}

export interface AIChatUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AIChatResult {
  content: string | null;
  tool_calls?: { function: { name: string; arguments: string } }[];
  usage?: AIChatUsage;
}

// ─── Gemini ──────────────────────────────────────────────────────────────

function buildGeminiContents(messages: ChatMessage[]) {
  const systemParts: string[] = [];
  const contents: any[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(typeof msg.content === "string" ? msg.content : msg.content.filter(p => p.type === "text").map(p => p.text).join("\n"));
      continue;
    }

    const role = msg.role === "assistant" ? "model" : "user";
    const parts: any[] = [];

    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          parts.push({ text: part.text });
        } else if (part.type === "image_url" && part.image_url?.url) {
          const url = part.image_url.url;
          if (url.startsWith("data:")) {
            const [meta, data] = url.split(",");
            const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
            parts.push({ inline_data: { mime_type: mime, data } });
          } else {
            parts.push({ text: `[Image: ${url}]` });
          }
        }
      }
    }

    if (parts.length > 0) contents.push({ role, parts });
  }

  return { systemInstruction: systemParts.length > 0 ? { parts: [{ text: systemParts.join("\n\n") }] } : undefined, contents };
}

function buildGeminiTools(tools?: ToolFunction[]) {
  if (!tools || tools.length === 0) return undefined;
  return [{
    function_declarations: tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  }];
}

async function callGemini(opts: AIChatOptions): Promise<AIChatResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = opts.model || "gemini-2.0-flash";
  // Normalize model name: strip provider prefixes
  const cleanModel = model.replace(/^google\//, "").replace(/-preview$/, "");

  const { systemInstruction, contents } = buildGeminiContents(opts.messages);
  const geminiTools = buildGeminiTools(opts.tools);

  const body: any = { contents };
  if (systemInstruction) body.systemInstruction = systemInstruction;
  if (geminiTools) body.tools = geminiTools;
  if (opts.tool_choice) {
    body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [opts.tool_choice.function.name] } };
  }

  const genConfig: any = {};
  if (opts.temperature !== undefined) genConfig.temperature = opts.temperature;
  if (opts.response_format?.type === "json_object") genConfig.responseMimeType = "application/json";
  if (Object.keys(genConfig).length > 0) body.generationConfig = genConfig;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Gemini error ${res.status}:`, errText);
    if (res.status === 429) throw Object.assign(new Error("Rate limit exceeded"), { status: 429 });
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const result = await res.json();
  const candidate = result.candidates?.[0];
  if (!candidate) throw new Error("No candidates in Gemini response");

  const parts = candidate.content?.parts || [];

  // Extract usage metadata
  const um = result.usageMetadata;
  const usage: AIChatUsage | undefined = um ? {
    input_tokens: um.promptTokenCount ?? 0,
    output_tokens: um.candidatesTokenCount ?? 0,
    total_tokens: um.totalTokenCount ?? 0,
  } : undefined;

  // Check for function calls
  const fnCall = parts.find((p: any) => p.functionCall);
  if (fnCall) {
    return {
      content: null,
      tool_calls: [{
        function: {
          name: fnCall.functionCall.name,
          arguments: JSON.stringify(fnCall.functionCall.args),
        },
      }],
      usage,
    };
  }

  // Text response
  const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join("");
  return { content: text, usage };
}

// ─── OpenAI ──────────────────────────────────────────────────────────────

async function callOpenAI(opts: AIChatOptions): Promise<AIChatResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const body: any = {
    model: opts.model || "gpt-4o-mini",
    messages: opts.messages,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.response_format) body.response_format = opts.response_format;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`OpenAI error ${res.status}:`, errText);
    if (res.status === 429) throw Object.assign(new Error("Rate limit exceeded"), { status: 429 });
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;
  const usage: AIChatUsage | undefined = data.usage ? {
    input_tokens: data.usage.prompt_tokens ?? 0,
    output_tokens: data.usage.completion_tokens ?? 0,
    total_tokens: data.usage.total_tokens ?? 0,
  } : undefined;
  return {
    content: choice?.content || null,
    tool_calls: choice?.tool_calls?.map((tc: any) => ({
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
    usage,
  };
}

// ─── Anthropic ───────────────────────────────────────────────────────────

async function callAnthropic(opts: AIChatOptions): Promise<AIChatResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const systemMsg = opts.messages.filter(m => m.role === "system").map(m => typeof m.content === "string" ? m.content : "").join("\n\n");
  const messages = opts.messages.filter(m => m.role !== "system").map(m => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : m.content.map(p => {
      if (p.type === "text") return { type: "text", text: p.text };
      if (p.type === "image_url" && p.image_url?.url.startsWith("data:")) {
        const [meta, data] = p.image_url.url.split(",");
        const mediaType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
        return { type: "image", source: { type: "base64", media_type: mediaType, data } };
      }
      return { type: "text", text: `[Image]` };
    }),
  }));

  const body: any = {
    model: opts.model || "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages,
  };
  if (systemMsg) body.system = systemMsg;
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.tools) {
    body.tools = opts.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Anthropic error ${res.status}:`, errText);
    if (res.status === 429) throw Object.assign(new Error("Rate limit exceeded"), { status: 429 });
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  const toolBlock = data.content?.find((b: any) => b.type === "tool_use");

  const usage: AIChatUsage | undefined = data.usage ? {
    input_tokens: data.usage.input_tokens ?? 0,
    output_tokens: data.usage.output_tokens ?? 0,
    total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
  } : undefined;

  if (toolBlock) {
    return {
      content: null,
      tool_calls: [{ function: { name: toolBlock.name, arguments: JSON.stringify(toolBlock.input) } }],
      usage,
    };
  }

  return { content: textBlock?.text || null, usage };
}

// ─── Main Entry Point ────────────────────────────────────────────────────

export async function aiChat(opts: AIChatOptions, provider?: Provider): Promise<AIChatResult> {
  const p = provider ?? "gemini";
  switch (p) {
    case "gemini": return callGemini(opts);
    case "openai": return callOpenAI(opts);
    case "anthropic": return callAnthropic(opts);
    default: throw new Error(`Unknown AI provider: ${p}`);
  }
}
