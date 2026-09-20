document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video-player');

  // Récupérer le paramètre 'url' transmis dans l'adresse de la page
  const urlParams = new URLSearchParams(window.location.search);
  const rawStreamUrl = urlParams.get('url');

  if (!rawStreamUrl) {
    alert("Aucun flux vidéo spécifié.");
    window.location.href = "index.html";
    return;
  }

  // Passer le flux M3U8 par la fonction serveur Cloudflare pour éviter les blocages CORS
  const proxiedUrl = `/api/proxy?url=${encodeURIComponent(rawStreamUrl)}`;

  if (Hls.isSupported()) {
    const hls = new Hls({
      capLevelToPlayerSize: true
    });
    
    hls.loadSource(proxiedUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {
        console.log("Lecture automatique désactivée par le navigateur. Cliquez sur Play.");
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error("Erreur fatale de lecture HLS:", data);
        // Tentative de secours : essai direct sans passer par le proxy
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.loadSource(rawStreamUrl);
        }
      }
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Lecture native pour les navigateurs sous iOS et Mac (Safari)
    video.src = rawStreamUrl;
  } else {
    alert("Votre navigateur ne supporte pas le format de lecture HLS (.m3u8).");
  }
});
