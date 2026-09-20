export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Erreur: URL cible manquante", { status: 400 });
  }

  try {
    // Forcer la requête vers le serveur distant
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return new Response(`Erreur distante: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const data = await response.arrayBuffer();

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  } catch (err) {
    return new Response("Erreur serveur lors de la récupération : " + err.message, { status: 500 });
  }
}
