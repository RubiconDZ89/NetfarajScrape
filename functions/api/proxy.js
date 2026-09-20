export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Erreur: URL manquante", { status: 400 });
  }

  try {
    // Télécharge le fichier M3U8 ou le segment TS depuis la source originale
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    // Reconstruit la réponse en autorisant l'accès Cross-Origin (CORS)
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (err) {
    return new Response("Erreur serveur lors de la récupération du flux : " + err.message, { status: 500 });
  }
}
