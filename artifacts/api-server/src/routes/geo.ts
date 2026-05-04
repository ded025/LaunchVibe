import { Router, type IRouter } from "express";

const router: IRouter = Router();

// GET /geo/search?q=...
router.get("/geo/search", async (req, res): Promise<void> => {
  const q = req.query.q as string;
  if (!q) { res.status(400).json({ error: "q parameter required" }); return; }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "ProofBase/1.0 (feedback platform)" },
    });

    if (!response.ok) {
      res.status(502).json({ error: "Geocoding service unavailable" });
      return;
    }

    const data = await response.json() as any[];

    const results = data.map((item) => ({
      displayName: item.display_name,
      city: item.address?.city ?? item.address?.town ?? item.address?.village ?? null,
      country: item.address?.country ?? "",
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    res.json(results);
  } catch {
    res.status(502).json({ error: "Geocoding failed" });
  }
});

export default router;
