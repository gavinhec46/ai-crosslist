// pages/api/ai/listing.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sku } = req.body || {};
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OpenAI API key" });

  try {
    // Call OpenAI's GPT-4o-mini model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that generates eBay-style listings based on images and product details. Respond with structured JSON only."
          },
          {
            role: "user",
            content: `Generate a listing for product ${sku}. Include title, description, category, condition, price, and average resale value.`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Try to parse AI output as JSON, or fallback
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = {
        title: text.slice(0, 80),
        description: text,
        category: "Clothing",
        condition: "Pre-owned",
        price: "25.00",
        average: "28.00",
      };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
}