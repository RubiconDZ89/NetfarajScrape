// Base de données des films/séries avec vos flux M3U8
const catalog = [
  {
    id: 1,
    title: "Sintel (Film d'animation)",
    description: "Un film d'animation open-source produit par la Fondation Blender.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: 2,
    title: "Tears of Steel",
    description: "Court-métrage de science-fiction dans un univers futuriste à Amsterdam.",
    poster: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500",
    streamUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8"
  },
  {
    id: 3,
    title: "Big Buck Bunny",
    description: "Un grand lapin rencontre trois rongeurs intimidants dans une forêt.",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500",
    streamUrl: "https://m3u8-proxy.user-837.workers.dev/https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('movie-grid');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  // Mettre en avant le premier élément dans le Hero
  if (catalog.length > 0) {
    const featured = catalog[0];
    heroTitle.textContent = featured.title;
    heroDesc.textContent = featured.description;
    heroPlayBtn.onclick = () => launchPlayer(featured.streamUrl);
  }

  // Générer la grille de films
  catalog.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}">
      <div class="card-info">
        <h3>${item.title}</h3>
      </div>
    `;

    card.addEventListener('click', () => launchPlayer(item.streamUrl));
    grid.appendChild(card);
  });
});

// Redirection vers la page du lecteur vidéo avec l'URL M3U8 transmise
function launchPlayer(url) {
  window.location.href = `player.html?url=${encodeURIComponent(url)}`;
}
