// pages/api/upload.js
import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false }, // disable default body parser
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Parse the incoming multipart form
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err || !files.file) {
        console.error("Upload parse error:", err);
        return res.status(400).json({ error: "Invalid file upload" });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const fileBuffer = fs.readFileSync(file.filepath);

      // Upload to Vercel Blob Storage
      const blob = await put(`uploads/${file.originalFilename}`, fileBuffer, {
        access: "public",
      });

      // Return the public URL
      return res.status(200).json({ url: blob.url });
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
}