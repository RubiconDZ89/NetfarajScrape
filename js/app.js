// =========================================================================
// 1. VOTRE LIEN M3U ET DÉMO
// =========================================================================

// INSÉREZ VOTRE LIEN M3U DANS CETTE VARIABLE :
const DEFAULT_M3U_URL = "http://204.52.191.254/get.php?username=0396db83515b&password=cd8f0dd386&type=m3u_plus&output=ts";

// Catalogue de démo (utilisé en cas d'erreur de chargement de votre lien M3U)
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
// 2. INITIALISATION ET CHARGEMENT AUTOMATIQUE AU DÉMARRAGE
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const loadBtn = document.getElementById('load-m3u-btn');
  const urlInput = document.getElementById('m3u-url-input');

  // Renseigner automatiquement le champ d'entrée avec votre lien
  if (urlInput) {
    urlInput.value = DEFAULT_M3U_URL;
  }

  // Lancement automatique du chargement de la liste M3U par défaut
  loadM3UPlaylist(DEFAULT_M3U_URL);

  // Gestion du chargement manuel via le bouton (si l'utilisateur veut tester un autre lien)
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
 * Fonction de téléchargement et d'affichage d'un fichier M3U
 */
async function loadM3UPlaylist(m3uUrl) {
  const loadBtn = document.getElementById('load-m3u-btn');
  
  if (loadBtn) {
    loadBtn.textContent = "Chargement...";
    loadBtn.disabled = true;
  }

  try {
    // Passage par la fonction Proxy Cloudflare pour contourner le blocage CORS
    const proxiedM3uUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl)}`;
    const response = await fetch(proxiedM3uUrl);

    if (!response.ok) {
      throw new Error("Impossible d'accéder au fichier M3U.");
    }

    const m3uText = await response.text();
    const playlistItems = parseM3U(m3uText);

    if (playlistItems.length === 0) {
      throw new Error("Aucun flux vidéo valide n'a été trouvé dans le fichier.");
    }

    // Affichage des éléments extraits
    renderCatalog(playlistItems);

  } catch (error) {
    console.warn("Erreur de chargement du M3U :", error.message);
    // En cas d'échec (ex: lien d'exemple non remplacé), affichage du catalogue de démo
    renderCatalog(fallbackCatalog);
  } finally {
    if (loadBtn) {
      loadBtn.textContent = "Charger le catalogue";
      loadBtn.disabled = false;
    }
  }
}

// =========================================================================
// 3. ANALYSEUR (PARSER) SYNTAXIQUE DU FICHIER M3U
// =========================================================================

function parseM3U(m3uData) {
  const lines = m3uData.split('\n');
  const items = [];
  let currentItem = null;

  lines.forEach((line) => {
    line = line.trim();

    if (line.startsWith('#EXTINF:')) {
      currentItem = {
        title: 'Canal sans nom',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
        streamUrl: ''
      };

      // Extraction du logo si la balise tvg-logo existe
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch && logoMatch[1]) {
        currentItem.poster = logoMatch[1];
      }

      // Extraction du titre (après la virgule)
      const titleParts = line.split(',');
      if (titleParts.length > 1) {
        currentItem.title = titleParts.slice(1).join(',').trim();
      }
    } else if (line.length > 0 && !line.startsWith('#') && currentItem) {
      currentItem.streamUrl = line;
      items.push(currentItem);
      currentItem = null;
    }
  });

  return items;
}

// =========================================================================
// 4. RENDU VISUEL DANS L'INTERFACE WEB
// =========================================================================

function renderCatalog(items) {
  const grid = document.getElementById('movie-grid');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  if (!grid) return;
  grid.innerHTML = '';

  // Configuration de la bannière principale (Hero)
  if (items.length > 0) {
    const featured = items[0];
    heroTitle.textContent = featured.title;
    heroDesc.textContent = featured.description || `Catalogue personnalisé (${items.length} vidéos disponibles).`;
    heroPlayBtn.onclick = () => launchPlayer(featured.streamUrl);
  }

  // Génération des cartes de films/séries dans la grille
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
