import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [skuCounter, setSkuCounter] = useState(1000);
  const [currentSku, setCurrentSku] = useState(`SKU-1000`);
  const [batches, setBatches] = useState([]);
  const [loadingSku, setLoadingSku] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const skuInputRef = useRef(null);

  /* ---------------------------------------------------------
     ☁️ LOAD BATCHES + LAST SKU FROM REDIS
  --------------------------------------------------------- */
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch batches
        const resBatches = await fetch("/api/batches");
        const data = await resBatches.json();
        if (Array.isArray(data)) setBatches(data);

        // Fetch last used SKU
        const resSku = await fetch("/api/batches?lastSku=true");
        const skuData = await resSku.json();
        if (skuData?.lastSku) {
          setCurrentSku(skuData.lastSku);
          const num = parseInt(skuData.lastSku.match(/\d+$/)?.[0] || "1000");
          setSkuCounter(num);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }
    loadData();
  }, []);

  /* ---------------------------------------------------------
     ☁️ CLOUDINARY UPLOAD HANDLER
  --------------------------------------------------------- */
  const handleUpload = async (e) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    setUploading(true);
    setUploadProgress(0);
    let uploadedCount = 0;
    const uploadedFiles = [];

    for (const file of incoming) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (data?.secure_url && data?.public_id) {
          uploadedFiles.push({
            uploadedUrl: data.secure_url,
            public_id: data.public_id,
            selected: false,
            assignedSku: null,
          });
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / incoming.length) * 100));
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setFiles((prev) => [...prev, ...uploadedFiles]);
    setUploading(false);
    setUploadComplete(true);
    setTimeout(() => setUploadComplete(false), 2500);
  };

  /* ---------------------------------------------------------
     🔘 SELECT / CLEAR / DELETE
  --------------------------------------------------------- */
  const toggleSelect = (public_id) =>
    setFiles((prev) =>
      prev.map((f) =>
        f.public_id === public_id ? { ...f, selected: !f.selected } : f
      )
    );

  const clearSelection = () =>
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })));

  const deleteSelected = () => {
    const toDelete = files.filter((f) => f.selected);
    if (toDelete.length === 0) return alert("No images selected.");
    if (!confirm(`Delete ${toDelete.length} selected image(s)?`)) return;
    setFiles((prev) => prev.filter((f) => !f.selected));
  };

  /* ---------------------------------------------------------
     🧾 ASSIGN SKU + SAVE TO REDIS + REMEMBER LAST SKU
  --------------------------------------------------------- */
  const handleAssignSku = async () => {
    const selectedFiles = files.filter((f) => f.selected && !f.assignedSku);
    if (selectedFiles.length === 0)
      return alert("Select at least one image first.");
    if (!currentSku.match(/\d+$/))
      return alert("Please enter a valid SKU ending with digits (e.g. SKU-1001).");

    const newBatchImages = selectedFiles.map((f) => f.uploadedUrl);
    const updatedFiles = files.map((f) =>
      f.selected ? { ...f, assignedSku: currentSku, selected: false } : f
    );
    setFiles(updatedFiles);

    try {
      // Save to Redis KV
      await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: currentSku,
          files: newBatchImages,
          status: "staged",
        }),
      });

      setBatches((prev) => [
        ...prev,
        { sku: currentSku, files: newBatchImages, status: "staged" },
      ]);

      console.log(`✅ ${currentSku} saved to Redis`);
    } catch (err) {
      console.error("❌ Failed to save SKU batch:", err);
    }

    // Auto-increment
    const nextNumber = parseInt(currentSku.match(/\d+$/)?.[0] || "0", 10) + 1;
    const prefix = currentSku.replace(/\d+$/, "");
    const nextSku = `${prefix}${nextNumber}`;
    setSkuCounter(nextNumber);
    setCurrentSku(nextSku);

    // Save new last SKU to Redis
    await fetch("/api/batches?lastSku=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: nextSku }),
    });

    alert(`Assigned ${selectedFiles.length} image(s) to ${currentSku}`);

    // Refocus input for next SKU entry
    if (skuInputRef.current) skuInputRef.current.focus();
  };

  /* ---------------------------------------------------------
     🤖 ANALYZE / GENERATE LISTING
  --------------------------------------------------------- */
  const generateListing = async (sku) => {
    const batch = batches.find((b) => b.sku === sku);
    if (!batch) return;
    setLoadingSku(sku);

    try {
      const resp = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: batch.files, sku }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      const updated = batches.map((b) =>
        b.sku === sku ? { ...b, ai: data, status: "ready" } : b
      );
      setBatches(updated);

      await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, files: batch.files, ai: data }),
      });

      alert(`✅ Listing generated for ${sku}`);
    } catch (err) {
      console.error("AI generation failed:", err);
      alert("Failed to analyze images.");
    } finally {
      setLoadingSku(null);
    }
  };

  /* ---------------------------------------------------------
     🖥️ UI
  --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* HEADER */}
      <header className="px-6 py-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-semibold">AI Crosslist — Cloud Connected</h1>
        <Link href="/listings" className="text-blue-600 hover:underline">
          View Completed Listings →
        </Link>
      </header>

      {/* UPLOAD AREA */}
      <section className="max-w-6xl mx-auto mt-6 bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">1️⃣ Upload Images</h2>
        <input type="file" accept="image/*" multiple onChange={handleUpload} />
        {uploading && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-blue-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        {uploadComplete && (
          <p className="mt-2 text-green-600 font-medium">✅ Upload complete!</p>
        )}
      </section>

      {/* SKU ENTRY + CONTROL BAR */}
      {files.length > 0 && (
        <div className="max-w-6xl mx-auto mt-4 bg-gray-100 p-4 rounded-lg shadow flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Enter SKU
            </label>
            <input
              ref={skuInputRef}
              type="text"
              value={currentSku}
              onChange={(e) => setCurrentSku(e.target.value)}
              placeholder="e.g., SKU-1001"
              className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-increments after assignment and persists in Redis
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAssignSku}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
            >
              Assign SKU
            </button>
            <button
              onClick={clearSelection}
              className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={deleteSelected}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* IMAGE GRID */}
      {files.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-8 sm:grid-cols-10 gap-2">
          {files.map((file) => (
            <div
              key={file.public_id}
              onClick={() => toggleSelect(file.public_id)}
              className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                file.selected
                  ? "border-blue-500 ring-2 ring-blue-400"
                  : file.assignedSku
                  ? "border-green-500"
                  : "border-gray-200"
              }`}
            >
              <img
                src={file.uploadedUrl.replace(
                  "/upload/",
                  "/upload/w_200,h_200,c_fill,q_auto,f_auto/"
                )}
                alt="thumb"
                className="w-full h-24 object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* SKU BATCHES */}
      {batches.length > 0 && (
        <section className="max-w-6xl mx-auto mt-10 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
            🧩 Assigned SKUs
          </h2>
          {batches.map((batch) => (
            <div
              key={batch.sku}
              className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-blue-700 text-lg">{batch.sku}</h3>
                <button
                  onClick={() => generateListing(batch.sku)}
                  disabled={loadingSku === batch.sku}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded shadow"
                >
                  {loadingSku === batch.sku ? "Analyzing..." : "🔍 Analyze / Generate Listing"}
                </button>
              </div>

              <div className="flex overflow-x-auto gap-2 pb-2">
                {(batch.files || []).map((url, i) => (
                  <img
                    key={i}
                    src={url.replace(
                      "/upload/",
                      "/upload/w_150,h_150,c_fill,q_auto,f_auto/"
                    )}
                    alt="batch-thumb"
                    className="w-24 h-24 object-cover rounded border flex-shrink-0"
                  />
                ))}
              </div>

              {batch.ai && (
                <div className="mt-3 bg-gray-50 border rounded p-3 text-sm">
                  <p><b>Title:</b> {batch.ai.title}</p>
                  <p><b>Price:</b> ${batch.ai.price}</p>
                  <p className="text-gray-600 mt-1">
                    {batch.ai.description?.slice(0, 120)}...
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
