// pages/index.js
import Head from "next/head";
import { useState, useMemo } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const previews = useMemo(() => files.map(f => f.localUrl), [files]);

  const handleUpload = (e) => {
    const incoming = Array.from(e.target.files || []);
    const selected = incoming.slice(0, 24);
    const staged = selected.map(file => ({
      file,
      localUrl: URL.createObjectURL(file),
    }));
    setFiles(staged);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Head>
        <title>AI CrossList</title>
        <meta
          name="description"
          content="AI-powered crosslisting and reselling workflow tool"
        />
      </Head>

      {/* Header */}
      <header className="px-6 py-4 border-b bg-white shadow-sm text-center">
        <h1 className="text-2xl font-semibold">🚀 AI CrossList</h1>
        <p className="text-sm text-gray-600">
          Upload images → (AI Draft coming next)
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <section className="bg-white p-6 rounded-2xl shadow">
          <h2 className="font-semibold mb-3 text-lg">1) Upload Images</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="block w-full text-sm text-gray-600 mb-4"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`preview-${i}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ))}
            </div>
          )}
        </section>

        {/* Placeholder for AI Draft */}
        <section className="bg-white p-6 rounded-2xl shadow flex flex-col justify-center text-center">
          <h2 className="font-semibold mb-3 text-lg">2) AI Draft</h2>
          <p className="text-gray-500">
            Coming next: automatic SEO title, description & comps generation.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} gkidstec — AI CrossList
      </footer>
    </div>
  );
}