const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export type DeepSeekMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: DeepSeekToolCall[];
    }
  | { role: "tool"; content: string; tool_call_id: string; name?: string };

export type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type DeepSeekTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type DeepSeekCompletion = {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: DeepSeekToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export async function deepseekChat(opts: {
  messages: DeepSeekMessage[];
  tools?: DeepSeekTool[];
  maxTokens?: number;
  temperature?: number;
}): Promise<DeepSeekCompletion> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model: "deepseek-chat",
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 300,
    temperature: opts.temperature ?? 0.7,
    stream: false,
  };
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${text}`);
  }

  return (await res.json()) as DeepSeekCompletion;
}

export function costEstimateUSD(tokens: number) {
  return (tokens / 1000) * 0.00014;
}
