// pages/index.js
import Head from "next/head";
import { useState, useMemo } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [sku, setSku] = useState(() => `SKU-${Date.now()}`);
  const [aiDraft, setAiDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const previews = useMemo(() => files.map(f => f.localUrl), [files]);

  const handleUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 24 - files.length);
    const staged = selectedFiles.map(file => ({
      file,
      localUrl: URL.createObjectURL(file),
    }));
    setFiles(prev => [...prev, ...staged]);
  };

  const generateDraft = async () => {
    if (files.length === 0) return alert("Upload an image first");
    setLoading(true);
    try {
      const resp = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const data = await resp.json();
      setAiDraft(data);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    if (!aiDraft) return;
    const draft = { sku, images: previews, ...aiDraft, savedAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem("drafts") || "[]");
    localStorage.setItem("drafts", JSON.stringify([draft, ...existing]));
    alert("Draft saved locally");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI CrossList</title>
        <meta name="description" content="AI powered crosslisting workflow" />
      </Head>

      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-2xl font-semibold">AI CrossList — Vision Workflow</h1>
        <p className="text-sm text-gray-600">
          Upload images → AI extracts details → Ready draft
        </p>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1) Upload */}
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
                  alt={`img${i}`}
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
            {loading ? "Generating..." : "Generate Listing (Mock)"}
          </button>
        </section>

        {/* 2) AI Draft */}
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
                  value={aiDraft.title}
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
                  value={aiDraft.description}
                  onChange={(e) =>
                    setAiDraft({ ...aiDraft, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </section>

        {/* 3) Save */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">3) Save Draft</h2>
          <button
            onClick={saveDraft}
            disabled={!aiDraft}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2"
          >
            Save Draft
          </button>
        </section>
      </main>

      <footer className="mt-8 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} gkidstec — All rights reserved.
      </footer>
    </div>
  );
}