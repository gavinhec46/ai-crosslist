// pages/api/upload.js
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // Mock upload route
  return res
    .status(200)
    .json({ url: "https://placehold.co/600x800?text=Uploaded+Mock" });
}