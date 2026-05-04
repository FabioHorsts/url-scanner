export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const allowed = ["http:", "https:"];
  if (!allowed.includes(parsed.protocol)) {
    return res.status(400).json({ error: "Protocol not allowed" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type");

    return res.status(200).json({
      ok: response.ok || response.status === 206,
      status: response.status,
      contentLength: contentLength ? parseInt(contentLength) : null,
      contentType: contentType || null,
    });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    return res.status(200).json({
      ok: false,
      status: 0,
      error: isTimeout ? "timeout" : "unreachable",
    });
  }
}
