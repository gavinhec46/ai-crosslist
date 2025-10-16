// pages/index.js
import Head from "next/head";
import { useState, useMemo } from "react";

export default function Home() {
  const [files, setFiles] = useState([]); // { file, localUrl, uploadedUrl }
  const [sku, setSku] = useState(() => `SKU-${Date.now()}`);
  const [aiDraft, setAiDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const previews = useMemo(() => files.map((f) => f.localUrl), [files]);

  // 🖼️ Handle uploads — send files to /api/upload and save returned URLs
  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(
      0,
      24 - files.length
    );
    if (!selectedFiles.length) return;

    const staged = selectedFiles.map((file) => ({
      file,
      localUrl: URL.createObjectURL(file),
      uploadedUrl: null,
    }));
    setFiles((prev) => [...prev, ...staged]);

    // upload to API for each file
    for (const s of staged) {
      const form = new FormData();
      form.append("file", s.file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (data?.url) {
          setFiles((prev) =>
            prev.map((x) =>
              x.localUrl === s.localUrl ? { ...x, uploadedUrl: data.url } : x
            )
          );
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  // 🤖 Generate AI listing using uploaded image URLs
  const generateDraft = async () => {
    if (files.length === 0) return alert("Upload at least one image first!");
    setLoading(true);
    try {
      const imageUrls = files.map((f) => f.uploadedUrl || f.localUrl);
      const resp = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, images: imageUrls }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setAiDraft(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate listing. Check logs or API key.");
    } finally {
      setLoading(false);
    }
  };

  // 💾 Save draft locally
  const saveDraft = () => {
    if (!aiDraft) return;
    const draft = {
      sku,
      images: files.map((f) => f.uploadedUrl || f.localUrl),
      ...aiDraft,
      savedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("drafts") || "[]");
    localStorage.setItem("drafts", JSON.stringify([draft, ...existing]));
    alert("Draft saved locally!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI CrossList</title>
        <meta
          name="description"
          content="AI-powered visual crosslisting and reselling workflow tool"
        />
      </Head>

      {/* Header */}
      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-2xl font-semibold">AI CrossList — Vision Workflow</h1>
        <p className="text-sm text-gray-600">
          Upload images → AI analyzes → Generate optimized listing
        </p>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1️⃣ Upload */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">1) Upload Photos</h2>
          <input type="file" accept="image/*" multiple onChange={handleUpload} />
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-full h-24 object-cover rounded border"
                  alt={`preview-${i}`}
                />
              ))}
            </div>
          )}
          <div className="mt-4">
            <label className="text-sm text-gray-600">SKU</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <button
            onClick={generateDraft}
            disabled={loading || files.length === 0}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2"
          >
            {loading ? "Analyzing images..." : "Generate Listing from Images"}
          </button>
        </section>

        {/* 2️⃣ AI Draft */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">2) AI Draft</h2>
          {!aiDraft ? (
            <p className="text-sm text-gray-500">Generate to see results.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">SEO Title</label>
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={aiDraft.title || ""}
                  onChange={(e) =>
                    setAiDraft({ ...aiDraft, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={aiDraft.description || ""}
                  onChange={(e) =>
                    setAiDraft({ ...aiDraft, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Category</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={aiDraft.category || ""}
                    onChange={(e) =>
                      setAiDraft({ ...aiDraft, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Condition</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={aiDraft.condition || ""}
                    onChange={(e) =>
                      setAiDraft({ ...aiDraft, condition: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Suggested Price</label>
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={aiDraft.price || ""}
                  onChange={(e) =>
                    setAiDraft({ ...aiDraft, price: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </section>

        {/* 3️⃣ Save */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">3) Save Draft</h2>
          <button
            onClick={saveDraft}
            disabled={!aiDraft}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2"
          >
            Save Draft
          </button>
          {aiDraft && (
            <div className="mt-4 p-3 bg-gray-50 border rounded text-sm">
              <div>
                <span className="text-gray-600">SKU:</span>{" "}
                <span className="font-medium">{sku}</span>
              </div>
              {aiDraft.price && (
                <div className="mt-1">
                  <span className="text-gray-600">Quick-Sale:</span>{" "}
                  ${aiDraft.price}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-8 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} gkidstec — All rights reserved.
      </footer>
    </div>
  );
}