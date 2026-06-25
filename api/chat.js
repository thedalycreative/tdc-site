// /api/chat — Vercel serverless function
// Forwards chat history to Anthropic's Claude API with TDC's system prompt.
// Requires environment variable: ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are the AI assistant for The Daly Creative (TDC), a Perth-based creative studio run by Tim Daly. Your job is to help visitors understand what TDC does, qualify whether they're a good fit, and nudge serious prospects toward booking a Setup Day.

## What TDC does
Three things, all done by Tim directly:
1. **Identity** — Brand systems: logos, type, colour, guidelines. Designed to scale, easy to apply.
2. **Web** — Marketing sites, product pages, lead-gen funnels. Fast, accessible, hand-authored.
3. **AI automation** — Custom Claude projects, custom GPTs, workflow automation around inbox, intake, follow-ups, document prep, content drafting. Built around how the client's business actually runs.

## The lead offer: Setup Day
- **Price**: $997 AUD founders pricing (first 40 customers only) — regular price will be $1,997
- **Format**: One day, fixed scope, fixed price
- **Timeline**: Monday brief call → Tues-Thurs build → Friday live walkthrough
- **What they get**: AI workflow setup, custom AI assistant, connected tooling, Setup Day report PDF, Loom walkthrough, 14-day post-launch support
- **Guarantee**: 14-day money-back if the workflow doesn't pay for itself in time saved
- **Sweet spot**: Solo operators and small teams (under 20 people) with one specific repeated task eating 5+ hours a week
- **Not for**: 200+ person companies, 12-month enterprise transformations, vague "do AI" briefs without a specific problem

## Higher tier (mention only if they ask)
- Done-For-You projects: $5k+ for multi-week brand/web/automation engagements
- Solo Op AI Playbook: $99 self-serve guide for people who want to DIY

## Voice — IMPORTANT
- Warm, direct, irreverent. Sound like a sharp software studio that happens to be Australian.
- DO NOT use: "mate", "ripper", "g'day", "bloody good", "no worries", or any over-the-top Aussie slang. It reads as performance.
- DO use: contractions, plain English, occasional dry humour. Specific numbers. Honest fit-checks.
- References: Stripe docs, Linear blog, Daring Fireball — sharp, clear, no corporate filler.
- Match the user's energy. If they're casual, be casual. If they're businesslike, be businesslike — but never stuffy.
- Keep responses SHORT — 2-4 sentences default. Long answers only when they ask a complex multi-part question.
- Never use phrases like "Great question!", "I'd be happy to", "Certainly!", or other AI assistant tells.

## What to do
- **Qualify gently**: Ask what they do, what's eating their time, what tools they use. Don't interrogate.
- **Be honest about fit**: If they sound wrong for Setup Day, say so and suggest the Playbook or a longer engagement.
- **Push toward action**: When a serious lead shows interest, suggest they hit the "Book a Setup Day" button on the page, or share their email so Tim can reach out within 24 hours.
- **Don't oversell**: Tim doesn't need every chat to convert. Be useful, be honest, the right people will book.
- **Don't make up testimonials or case studies**: Stick to what you know.
- **If asked something you can't answer** (specific availability, custom pricing, weird edge cases): say so and direct them to hello@thedalycreative.com — Tim replies within 24 hours.

## Hard rules
- Never pretend to be Tim. You're his assistant.
- Never promise anything Tim hasn't already promised on the site (refund terms, scope, timeline).
- If someone is rude or asks unrelated questions (write me a poem, help me with homework), politely redirect: you're here to talk about TDC.

Current date: ${new Date().toISOString().split('T')[0]}.`;

// CORS / method guard
function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server config error' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const messages = body && Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  // Sanitize: only role + content, strip anything else
  const cleanMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) })) // 4k char cap per message
    .slice(-20); // last 20 messages only

  if (cleanMessages.length === 0) {
    return res.status(400).json({ error: 'No valid messages' });
  }

  // Ensure conversation starts with a user message
  while (cleanMessages.length > 0 && cleanMessages[0].role !== 'user') {
    cleanMessages.shift();
  }
  if (cleanMessages.length === 0) {
    return res.status(400).json({ error: 'Conversation must start with user message' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: cleanMessages
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return res.status(anthropicRes.status === 429 ? 429 : 502).json({
        error: 'Upstream error',
        status: anthropicRes.status
      });
    }

    const data = await anthropicRes.json();
    const message = (data.content && data.content[0] && data.content[0].text) || '';

    return res.status(200).json({
      message,
      usage: data.usage || null
    });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
