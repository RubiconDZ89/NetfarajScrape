const DEFAULT_M3U_URL = "http://204.52.191.254/get.php?username=0396db83515b&password=cd8f0dd386&type=m3u_plus&output=ts";

const fallbackCatalog = [
  {
    title: "Sintel (Film d'animation)",
    description: "Un film d'animation open-source produit par la Fondation Blender.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    title: "Tears of Steel",
    description: "Court-métrage de science-fiction.",
    poster: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500",
    streamUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const loadBtn = document.getElementById('load-m3u-btn');
  const urlInput = document.getElementById('m3u-url-input');

  if (urlInput) {
    urlInput.value = DEFAULT_M3U_URL;
  }

  loadM3UPlaylist(DEFAULT_M3U_URL);

  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      const customUrl = urlInput.value.trim();
      if (customUrl) loadM3UPlaylist(customUrl);
    });
  }
});

async function loadM3UPlaylist(m3uUrl) {
  const loadBtn = document.getElementById('load-m3u-btn');
  const heroTitle = document.getElementById('hero-title');

  if (heroTitle) heroTitle.textContent = "Chargement du catalogue...";
  if (loadBtn) {
    loadBtn.textContent = "Chargement...";
    loadBtn.disabled = true;
  }

  try {
    const proxiedM3uUrl = `/api/proxy?url=${encodeURIComponent(m3uUrl)}`;
    const response = await fetch(proxiedM3uUrl);

    if (!response.ok) {
      throw new Error(`Code HTTP ${response.status}`);
    }

    const m3uText = await response.text();
    const playlistItems = parseM3U(m3uText);

    if (playlistItems.length === 0) {
      throw new Error("Aucun élément trouvé dans la liste M3U.");
    }

    renderCatalog(playlistItems);

  } catch (error) {
    console.error("Erreur de chargement M3U :", error);
    alert("Impossible de charger le lien M3U (Erreur : " + error.message + "). Affichage de la démo.");
    renderCatalog(fallbackCatalog);
  } finally {
    if (loadBtn) {
      loadBtn.textContent = "Charger le catalogue";
      loadBtn.disabled = false;
    }
  }
}

function parseM3U(m3uData) {
  const lines = m3uData.split('\n');
  const items = [];
  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      currentItem = {
        title: 'Chaîne / Film',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
        streamUrl: ''
      };

      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch && logoMatch[1]) {
        currentItem.poster = logoMatch[1];
      }

      const titleParts = line.split(',');
      if (titleParts.length > 1) {
        currentItem.title = titleParts.slice(1).join(',').trim();
      }
    } else if (line.length > 0 && !line.startsWith('#') && currentItem) {
      currentItem.streamUrl = line;
      items.push(currentItem);
      currentItem = null;

      // Limite à 150 éléments pour ne pas ralentir le navigateur
      if (items.length >= 150) break;
    }
  }

  return items;
}

function renderCatalog(items) {
  const grid = document.getElementById('movie-grid');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  if (!grid) return;
  grid.innerHTML = '';

  if (items.length > 0) {
    const featured = items[0];
    heroTitle.textContent = featured.title;
    heroDesc.textContent = `Catalogue chargé avec succès (${items.length} contenus affichés).`;
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

function launchPlayer(url) {
  window.location.href = `player.html?url=${encodeURIComponent(url)}`;
}
