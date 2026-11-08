const SYSTEM = "You are Fairway, a friendly, practical golf coach. Give clear, safe advice on swing technique, club choice, course strategy and practice drills. Keep answers under 150 words. If a question is not about golf, gently steer back to golf.";
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { messages } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || !messages.length) return { statusCode: 400, body: "No messages" };
    const clean = messages.slice(-12).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000)
    }));
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 500, system: SYSTEM, messages: clean })
    });
    if (!r.ok) return { statusCode: 502, body: "AI error" };
    const d = await r.json();
    const reply = d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, body: "Server error" };
  }
};
