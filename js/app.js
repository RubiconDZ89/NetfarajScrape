// =========================================================================
// 1. CONFIGURATION DU FLUX M3U
// =========================================================================

// Lien M3U de votre abonnement
const DEFAULT_M3U_URL = "http://204.52.191.254/get.php?username=0396db83515b&password=cd8f0dd386&type=m3u_plus&output=m3u_8";

// Catalogue de démo (utilisé en dernier recours en cas de problème réseau)
const fallbackCatalog = [
  {
    title: "Sintel (Film d'animation)",
    description: "Un film d'animation open-source produit par la Fondation Blender.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    title: "Tears of Steel",
    description: "Court-métrage de science-fiction dans un univers futuriste à Amsterdam.",
    poster: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500",
    streamUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8"
  }
];

// =========================================================================
// 2. INITIALISATION ET CHARGEMENT AU DÉMARRAGE
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const loadBtn = document.getElementById('load-m3u-btn');
  const urlInput = document.getElementById('m3u-url-input');

  // Pré-remplir le champ avec le lien M3U
  if (urlInput) {
    urlInput.value = DEFAULT_M3U_URL;
  }

  // Démarrer le chargement automatique du flux
  loadM3UPlaylist(DEFAULT_M3U_URL);

  // Gestion de la soumission manuelle via le formulaire
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      const customUrl = urlInput.value.trim();
      if (!customUrl) {
        alert("Veuillez entrer une URL M3U valide.");
        return;
      }
      loadM3UPlaylist(customUrl);
    });
  }
});

/**
 * Télécharge et traite le fichier M3U de manière sécurisée
 */
async function loadM3UPlaylist(m3uUrl) {
  const loadBtn = document.getElementById('load-m3u-btn');
  const heroTitle = document.getElementById('hero-title');

  if (heroTitle) heroTitle.textContent = "Connexion au serveur M3U...";
  if (loadBtn) {
    loadBtn.textContent = "Chargement...";
    loadBtn.disabled = true;
  }

  let m3uText = null;

  // Tentative 1 : Via le Proxy Cloudflare interne
  try {
    const proxiedM3uUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl)}`;
    const response = await fetch(proxiedM3uUrl);
    if (response.ok) {
      m3uText = await response.text();
    }
  } catch (e) {
    console.warn("Échec du proxy Cloudflare, tentative via le proxy de secours...", e);
  }

  // Tentative 2 : Via un proxy externe (si la tentative 1 échoue ou retourne une erreur)
  if (!m3uText) {
    try {
      const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(m3uUrl)}`;
      const response = await fetch(fallbackProxyUrl);
      if (response.ok) {
        m3uText = await response.text();
      }
    } catch (e) {
      console.error("Échec du proxy de secours :", e);
    }
  }

  // Traitement du texte M3U extrait
  if (m3uText) {
    try {
      const playlistItems = await parseM3UOptimized(m3uText);
      if (playlistItems.length > 0) {
        renderCatalog(playlistItems);
      } else {
        throw new Error("Aucun élément valide extrait du M3U.");
      }
    } catch (error) {
      console.error("Erreur de traitement M3U :", error);
      renderCatalog(fallbackCatalog);
    }
  } else {
    console.warn("Impossible de récupérer le contenu M3U. Affichage de la démo.");
    renderCatalog(fallbackCatalog);
  }

  if (loadBtn) {
    loadBtn.textContent = "Charger le catalogue";
    loadBtn.disabled = false;
  }
}

// =========================================================================
// 3. ANALYSEUR M3U OPTIMISÉ (POUR ÉVITER LE GEL DU NAVIGATEUR)
// =========================================================================

/**
 * Lit le fichier M3U de manière asynchrone sans figer le fil principal (Main Thread)
 */
function parseM3UOptimized(m3uData, maxItems = 150) {
  return new Promise((resolve) => {
    const lines = m3uData.split('\n');
    const items = [];
    let currentItem = null;
    let i = 0;

    function processChunk() {
      const chunkSize = 2000; // Traiter 2000 lignes par micro-tâche
      const end = Math.min(i + chunkSize, lines.length);

      for (; i < end; i++) {
        let line = lines[i].trim();

        if (line.startsWith('#EXTINF:')) {
          currentItem = {
            title: 'Contenu sans nom',
            poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
            streamUrl: ''
          };

          // Extraire l'icône/logo s'il est présent
          const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
          if (logoMatch && logoMatch[1]) {
            currentItem.poster = logoMatch[1];
          }

          // Extraire le titre du média
          const titleParts = line.split(',');
          if (titleParts.length > 1) {
            currentItem.title = titleParts.slice(1).join(',').trim();
          }
        } else if (line.length > 0 && !line.startsWith('#') && currentItem) {
          currentItem.streamUrl = line;
          items.push(currentItem);
          currentItem = null;

          if (items.length >= maxItems) {
            resolve(items);
            return;
          }
        }
      }

      if (i < lines.length && items.length < maxItems) {
        // Laisser respirer l'interface utilisateur avant le prochain lot
        setTimeout(processChunk, 0);
      } else {
        resolve(items);
      }
    }

    processChunk();
  });
}

// =========================================================================
// 4. GENERATION DU CATALOGUE VISUEL
// =========================================================================

function renderCatalog(items) {
  const grid = document.getElementById('movie-grid');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  if (!grid) return;
  grid.innerHTML = '';

  // Mise à jour de la bannière d'accueil
  if (items.length > 0) {
    const featured = items[0];
    if (heroTitle) heroTitle.textContent = featured.title;
    if (heroDesc) heroDesc.textContent = `Catalogue prêt (${items.length} contenus disponibles).`;
    if (heroPlayBtn) heroPlayBtn.onclick = () => launchPlayer(featured.streamUrl);
  }

  // Injecter chaque média sous forme de carte
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'">
      <div class="card-info">
        <h3>${item.title}</h3>
      </div>
    `;

    card.addEventListener('click', () => launchPlayer(item.streamUrl));
    grid.appendChild(card);
  });
}

// =========================================================================
// 5. REDIRECTION VERS LE LECTEUR VIDÉO
// =========================================================================

function launchPlayer(url) {
  window.location.href = `player.html?url=${encodeURIComponent(url)}`;
}
