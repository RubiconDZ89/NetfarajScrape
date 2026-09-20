// Catalogue par défaut (démo)
const defaultCatalog = [
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

document.addEventListener('DOMContentLoaded', () => {
  const loadBtn = document.getElementById('load-m3u-btn');
  const urlInput = document.getElementById('m3u-url-input');

  // Affichage initial du catalogue de démo
  renderCatalog(defaultCatalog);

  // Gestion du chargement de fichier M3U via URL
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const m3uUrl = urlInput.value.trim();
      if (!m3uUrl) {
        alert("Veuillez entrer une URL M3U valide.");
        return;
      }

      loadBtn.textContent = "Chargement...";
      loadBtn.disabled = true;

      try {
        // Passage par le proxy Cloudflare pour éviter le blocage CORS
        const proxiedM3uUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl)}`;
        const response = await fetch(proxiedM3uUrl);

        if (!response.ok) {
          throw new Error("Impossible de télécharger le fichier M3U.");
        }

        const m3uText = await response.text();
        const playlistItems = parseM3U(m3uText);

        if (playlistItems.length === 0) {
          alert("Aucun flux vidéo valide n'a été trouvé dans ce fichier M3U.");
        } else {
          renderCatalog(playlistItems);
        }
      } catch (error) {
        console.error("Erreur M3U :", error);
        alert("Erreur lors du traitement de la liste : " + error.message);
      } finally {
        loadBtn.textContent = "Charger le catalogue";
        loadBtn.disabled = false;
      }
    });
  }
});

/**
 * Analyseur de syntaxe M3U (#EXTINF)
 */
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

      // Extraction du logo si présent
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch && logoMatch[1]) {
        currentItem.poster = logoMatch[1];
      }

      // Extraction du titre
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

/**
 * Injection des cartes dans l'interface web
 */
function renderCatalog(items) {
  const grid = document.getElementById('movie-grid');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  grid.innerHTML = '';

  if (items.length > 0) {
    const featured = items[0];
    heroTitle.textContent = featured.title;
    heroDesc.textContent = featured.description || `Flux extrait du catalogue (${items.length} contenus disponibles).`;
    heroPlayBtn.onclick = () => launchPlayer(featured.streamUrl);
  }

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

/**
 * Redirection vers le lecteur vidéo
 */
function launchPlayer(url) {
  window.location.href = `player.html?url=${encodeURIComponent(url)}`;
}
