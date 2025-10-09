export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });

  const appId = process.env.EBAY_APP_ID;
  if (!appId) return res.status(500).json({ error: "Missing EBAY_APP_ID" });

  try {
    const from = new Date(Date.now() - 90*24*60*60*1000).toISOString();
    const to = new Date().toISOString();
    const endpoint = "https://svcs.ebay.com/services/search/FindingService/v1";
    const params = new URLSearchParams({
      "OPERATION-NAME": "findCompletedItems",
      "SERVICE-VERSION": "1.13.0",
      "RESPONSE-DATA-FORMAT": "JSON",
      "REST-PAYLOAD": "true",
      "keywords": title,
      "itemFilter(0).name": "SoldItemsOnly",
      "itemFilter(0).value": "true",
      "itemFilter(1).name": "EndTimeFrom",
      "itemFilter(1).value": from,
      "itemFilter(2).name": "EndTimeTo",
      "itemFilter(2).value": to,
      "paginationInput.entriesPerPage": "25"
    });
    const resp = await fetch(`${endpoint}?${params}`);
    const json = await resp.json();

    const items = json?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
    const prices = items
      .map(i => parseFloat(i?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || "0"))
      .filter(n => n > 0);

    if (prices.length === 0) return res.status(200).json({ average: "-", quickSale: "-", count: 0 });

    const avg = prices.reduce((a,b)=>a+b,0)/prices.length;
    const quick = Math.max(5, +(avg*0.9).toFixed(2));
    return res.status(200).json({ average: avg.toFixed(2), quickSale: quick.toFixed(2), count: prices.length });
  } catch (e) {
    console.error("eBay comps error:", e);
    return res.status(500).json({ error: "Failed to fetch comps" });
  }
}
