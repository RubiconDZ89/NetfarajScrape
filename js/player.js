document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video-player');

  // Récupération de l'URL passée en paramètre
  const urlParams = new URLSearchParams(window.location.search);
  const rawStreamUrl = urlParams.get('url');

  if (!rawStreamUrl) {
    alert("Aucune vidéo spécifiée.");
    window.location.href = "index.html";
    return;
  }

  // Application du proxy Cloudflare pour contourner CORS
  const proxiedUrl = `/api/proxy?url=${encodeURIComponent(rawStreamUrl)}`;

  if (Hls.isSupported()) {
    const hls = new Hls({
      capLevelToPlayerSize: true
    });
    
    hls.loadSource(proxiedUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {
        console.log("Lecture automatique bloquée par le navigateur.");
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error("Erreur HLS fatale :", data);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Tentative de repli sans proxy
          hls.loadSource(rawStreamUrl);
        }
      }
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Lecture native sous Safari (Mac / iOS)
    video.src = rawStreamUrl;
  } else {
    alert("Votre navigateur ne supporte pas la lecture de ce format.");
  }
});
