export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { images, sku } = req.body || {};
  if (!images || images.length === 0)
    return res.status(400).json({ error: "No images provided" });

  try {
    // ⚙️ Use OpenAI if your key is set; otherwise return mock data
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.warn("Missing OPENAI_API_KEY, returning mock response");
      return res.status(200).json({
        title: `Example Listing for ${sku}`,
        description:
          "AI-generated product description placeholder. Add your details here.",
        category: "Clothing",
        condition: "Pre-owned",
        price: "25.00",
        average: "28.00",
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an eBay listing generator." },
          {
            role: "user",
            content: `Generate a title, description, category, condition, and price estimate for an item based on these image URLs: ${images.join(", ")}.`,
          },
        ],
      }),
    });

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/title:(.*)\ndescription:(.*)/i);
    return res.status(200).json({
      title: match?.[1]?.trim() || "AI Listing Title",
      description: match?.[2]?.trim() || text,
      category: "Apparel",
      condition: "Used",
      price: "25.00",
      average: "28.00",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
}