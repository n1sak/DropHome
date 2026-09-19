/**
 * Optional: relay a sorting prompt to Claude. The client builds the prompt and
 * validates the answer, so this file is only the HTTP call.
 */
const API = 'https://api.anthropic.com/v1/messages';

export const hasAi = () => !!process.env.ANTHROPIC_API_KEY;

export async function complete(prompt) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  return (body.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}
