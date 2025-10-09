import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { images = [], sku, average, quickSale } = req.body;

  try {
    // ✅ Fix relative image paths
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const imageInputs = (images || []).slice(0, 10).map((url) => ({
      type: "image_url",
      image_url: { url: url.startsWith("http") ? url : `${baseUrl}${url}` },
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are an expert eBay seller assistant. 
Generate a JSON object with the following keys:
- title (SEO optimized, max 80 characters)
- description (professional, buyer-friendly, multiline)
- category (best fit eBay category)
- weight (estimate if missing)
- price (suggested quick-sale price under 90 days)
Always return valid JSON, no markdown, no extra text.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Item SKU: ${sku || "N/A"}.
Here are comps: average sold $${average || "N/A"}, quick-sale $${quickSale || "N/A"}.
Use the images to identify brand, size, condition, color, and specifics.` },
            ...imageInputs,
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("AI returned invalid JSON:", raw);
      json = {
        title: "N/A",
        description: "N/A",
        category: "N/A",
        weight: "N/A",
        price: "N/A",
      };
    }

    return res.status(200).json(json);
  } catch (err) {
    console.error("AI listing error:", err);
    return res.status(500).json({ error: "Failed to generate AI listing" });
  }
}
