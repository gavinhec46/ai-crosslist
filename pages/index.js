import { useMemo, useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]); // {file, localUrl, uploadedUrl}
  const [sku, setSku] = useState(() => `SKU-${Date.now()}`);
  const [ai, setAi] = useState(null);
  const [comps, setComps] = useState(null);
  const [loading, setLoading] = useState(false);
  const previews = useMemo(() => files.map(f => f.localUrl), [files]);

  const handleUpload = async (e) => {
    const incoming = Array.from(e.target.files || []);
    const room = 24 - files.length;
    const selected = incoming.slice(0, Math.max(0, room));
    if (!selected.length) return;

    const staged = selected.map(file => ({
      file,
      localUrl: URL.createObjectURL(file),
      uploadedUrl: null,
    }));
    setFiles(prev => [...prev, ...staged]);

    for (const s of staged) {
      const form = new FormData();
      form.append("file", s.file);
      try {
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const data = await r.json();
        if (data?.url) {
          setFiles(prev => prev.map(x => x.localUrl === s.localUrl ? { ...x, uploadedUrl: data.url } : x));
        }
      } catch (err) { console.error("upload failed", err); }
    }
  };

  const generateFromImages = async () => {
    if (files.length === 0) return alert("Upload at least one image");
    setLoading(true);
    try {
      const imageUrls = files.map(f => f.uploadedUrl || f.localUrl);
      const resp = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imageUrls, sku }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setAi(data);
      setComps({ average: data.average || data.price || "", quickSale: data.price || "" });
    } catch (err) {
      console.error(err);
      alert("Failed to generate from images. Check server logs.");
    } finally { setLoading(false); }
  };

  const saveDraft = () => {
    if (!ai) return alert("Generate first");
    const draft = {
      sku,
      images: files.map(f => f.uploadedUrl || f.localUrl),
      ...ai,
      savedAt: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem("drafts") || "[]");
    localStorage.setItem("drafts", JSON.stringify([draft, ...existing]));
    alert("Saved draft locally");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-2xl font-semibold">AI Crosslist — Vision Workflow</h1>
        <p className="text-sm text-gray-600">Upload images → AI extracts details → Comps → Ready draft</p>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1) Upload + SKU */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">1) Upload Photos (max 24)</h2>
          <input type="file" accept="image/*" multiple onChange={handleUpload} />
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {previews.map((src, i) => (
                <img key={i} src={src} className="w-full h-24 object-cover rounded border" alt={"img"+i} />
              ))}
            </div>
          )}
          <div className="mt-4">
            <label className="text-sm text-gray-600">SKU</label>
            <input value={sku} onChange={e=>setSku(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
          </div>
          <button onClick={generateFromImages} disabled={loading || files.length===0}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2">
            {loading ? "Analyzing images…" : "Generate Listing from Images"}
          </button>
        </section>

        {/* 2) AI Draft */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">2) AI Draft</h2>
          {!ai ? <p className="text-sm text-gray-500">Generate to see results.</p> : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">SEO Title</label>
                <input className="mt-1 w-full border rounded px-2 py-1" maxLength={80}
                  value={ai.title || ""} onChange={e => setAi({ ...ai, title: e.target.value })} />
                <div className="text-xs text-gray-500 mt-1">{(ai.title || "").length}/80</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea rows={8} className="mt-1 w-full border rounded px-2 py-1"
                  value={ai.description || ""} onChange={e => setAi({ ...ai, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Category</label>
                  <input className="mt-1 w-full border rounded px-2 py-1"
                    value={ai.category || ""} onChange={e => setAi({ ...ai, category: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Condition</label>
                  <input className="mt-1 w-full border rounded px-2 py-1"
                    value={ai.condition || ""} onChange={e => setAi({ ...ai, condition: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Suggested Price</label>
                <input className="mt-1 w-full border rounded px-2 py-1"
                  value={ai.price || ""} onChange={e => setAi({ ...ai, price: e.target.value })} />
              </div>
            </div>
          )}
        </section>

        {/* 3) Save */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">3) Save Draft</h2>
          <button onClick={saveDraft} disabled={!ai}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2">Save Draft</button>
          {ai && (
            <div className="mt-4 p-3 bg-gray-50 border rounded text-sm">
              <div><span className="text-gray-600">SKU:</span> <span className="font-medium">{sku}</span></div>
              {ai.average && <div className="mt-1"><span className="text-gray-600">Avg:</span> ${ai.average}</div>}
              {ai.price && <div className="mt-1"><span className="text-gray-600">Quick-Sale:</span> ${ai.price}</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
