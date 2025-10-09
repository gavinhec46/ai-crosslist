import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = formidable({ multiples: false, uploadDir, keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message });
      const f = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!f) return res.status(400).json({ error: "No file" });
      const filename = path.basename(f.filepath || f.path);
      return res.status(200).json({ url: `/uploads/${filename}` });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Upload failed" });
  }
}
