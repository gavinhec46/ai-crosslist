// pages/api/ai/listing.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sku } = req.body || {};
  return res.status(200).json({
    title: `Example Listing for ${sku}`,
    description: "Mock AI description for your product. Replace this with real OpenAI results later.",
    category: "Apparel",
    condition: "Pre-owned",
    price: "25.00",
    average: "28.00"
  });
}