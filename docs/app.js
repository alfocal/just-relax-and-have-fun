/**
 * Just Relax and Have Fun - Pixel Art Gallery App
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    challenges: [],
    selectedWeek: 'all',
    selectedAuthor: 'all',
    searchQuery: '',
    currentModalItem: null,
    currentZoom: 8,
    currentBg: 'checker'
  };

  // DOM Elements
  const galleryContainer = document.getElementById('gallery-container');
  const statChallenges = document.getElementById('stat-challenges');
  const statArtworks = document.getElementById('stat-artworks');
  const filterWeek = document.getElementById('filter-week');
  const filterAuthor = document.getElementById('filter-author');
  const searchInput = document.getElementById('search-input');
  const themeSelect = document.getElementById('theme-select');

  // Inicializar Tema visual
  function initTheme() {
    const savedTheme = localStorage.getItem('pixelart_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) {
      themeSelect.value = savedTheme;
      themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('pixelart_theme', newTheme);
      });
    }
  }
  initTheme();

  // Modal Elements
  const modal = document.getElementById('pixel-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCanvasWrapper = document.getElementById('modal-canvas-wrapper');
  const modalImage = document.getElementById('modal-image');
  const modalWeek = document.getElementById('modal-week');
  const modalTitle = document.getElementById('modal-title');
  const modalAuthorName = document.getElementById('modal-author-name');
  const modalTheme = document.getElementById('modal-theme');
  const modalPalette = document.getElementById('modal-palette');
  const modalActions = document.getElementById('modal-actions');
  const zoomButtons = document.getElementById('zoom-buttons');
  const bgButtons = document.getElementById('bg-buttons');

  // Fetch Gallery Data
  async function loadGalleryData() {
    try {
      const response = await fetch('./data.json?v=' + Date.now());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      state.challenges = data.challenges || [];
      initUI(data);
    } catch (err) {
      console.warn('No se pudo cargar data.json dinámicamente:', err);
      // Fallback si no hay data.json o está en file://
      renderFallback();
    }
  }

  function initUI(data) {
    // Actualizar contadores
    statChallenges.textContent = data.totalChallenges || state.challenges.length;
    statArtworks.textContent = data.totalArtworks || countTotalArtworks(state.challenges);

    // Llenar filtros
    populateFilters();

    // Renderizar
    renderGallery();

    // Event Listeners
    setupEventListeners();
  }

  function countTotalArtworks(challenges) {
    let count = 0;
    challenges.forEach(c => {
      (c.submissions || []).forEach(s => {
        count += (s.images || []).length;
      });
    });
    return count;
  }

  function populateFilters() {
    // Semanas
    filterWeek.innerHTML = '<option value="all">Todas las semanas</option>';
    state.challenges.forEach(c => {
      const opt = document.createElement('option');
      opt.value = `${c.year}-${c.week}`;
      opt.textContent = `${c.week.toUpperCase()} (${c.year}) - ${c.theme || 'Reto'}`;
      filterWeek.appendChild(opt);
    });

    // Autores únicos
    const authors = new Set();
    state.challenges.forEach(c => {
      (c.submissions || []).forEach(s => {
        if (s.author) authors.add(s.author);
      });
    });

    filterAuthor.innerHTML = '<option value="all">Todos los autores</option>';
    Array.from(authors).sort().forEach(author => {
      const opt = document.createElement('option');
      opt.value = author;
      opt.textContent = `@${author}`;
      filterAuthor.appendChild(opt);
    });
  }

  function setupEventListeners() {
    filterWeek.addEventListener('change', (e) => {
      state.selectedWeek = e.target.value;
      renderGallery();
    });

    filterAuthor.addEventListener('change', (e) => {
      state.selectedAuthor = e.target.value;
      renderGallery();
    });

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderGallery();
    });

    // Modal Events
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Zoom buttons
    zoomButtons.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        zoomButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const zoom = parseInt(btn.dataset.zoom, 10);
        setModalZoom(zoom);
      });
    });

    // Background buttons
    bgButtons.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        bgButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const bg = btn.dataset.bg;
        setModalBg(bg);
      });
    });
  }

  function renderGallery() {
    galleryContainer.innerHTML = '';

    const filteredChallenges = state.challenges.filter(c => {
      // Filtro de semana
      if (state.selectedWeek !== 'all') {
        const weekKey = `${c.year}-${c.week}`;
        if (weekKey !== state.selectedWeek) return false;
      }

      // Si hay filtro de autor o búsqueda, comprobamos si algún submission coincide
      const matchesAuthor = state.selectedAuthor === 'all' || 
        (c.submissions || []).some(s => s.author === state.selectedAuthor);
      if (!matchesAuthor) return false;

      // Filtro de búsqueda
      if (state.searchQuery) {
        const q = state.searchQuery;
        const matchesTheme = (c.theme || '').toLowerCase().includes(q);
        const matchesWeek = (c.week || '').toLowerCase().includes(q);
        const matchesYear = (c.year || '').toString().includes(q);
        const matchesPalette = (c.palette?.name || '').toLowerCase().includes(q);
        const matchesSubmissions = (c.submissions || []).some(s => 
          s.author.toLowerCase().includes(q) || 
          (s.images || []).some(img => img.filename.toLowerCase().includes(q))
        );

        if (!matchesTheme && !matchesWeek && !matchesYear && !matchesPalette && !matchesSubmissions) {
          return false;
        }
      }

      return true;
    });

    if (filteredChallenges.length === 0) {
      galleryContainer.innerHTML = `
        <div class="empty-state">
          <p>👾 No se encontraron retos u obras con los filtros actuales.</p>
        </div>
      `;
      return;
    }

    filteredChallenges.forEach(challenge => {
      const challengeEl = createChallengeCard(challenge);
      galleryContainer.appendChild(challengeEl);
    });
  }

  function createChallengeCard(challenge) {
    const card = document.createElement('section');
    card.className = 'challenge-card';

    // Header del reto
    const header = document.createElement('div');
    header.className = 'challenge-header';
    header.innerHTML = `
      <div class="challenge-heading-group">
        <span class="week-tag">${challenge.week.toUpperCase()} · ${challenge.year}</span>
        <h2 class="challenge-theme-title">Tema: <span>${escapeHtml(challenge.theme || 'Libre')}</span></h2>
      </div>
      ${challenge.dates ? `<span class="challenge-dates">📅 ${escapeHtml(challenge.dates)}</span>` : ''}
    `;
    card.appendChild(header);

    // Barra de metadatos (Paleta Lospec)
    const metaBar = document.createElement('div');
    metaBar.className = 'challenge-meta-bar';

    const paletteName = challenge.palette?.name || 'Paleta aleatoria';
    const paletteUrl = challenge.palette?.url || 'https://lospec.com/palette-list/random';
    const colors = challenge.palette?.colors || [];

    let swatchesHtml = '';
    if (colors.length > 0) {
      swatchesHtml = `
        <div class="swatches-container" title="Colores de la paleta">
          ${colors.map(c => `
            <span class="color-swatch" style="background-color: ${escapeHtml(c)}" title="${escapeHtml(c)}" onclick="navigator.clipboard.writeText('${escapeHtml(c)}')"></span>
          `).join('')}
        </div>
      `;
    }

    metaBar.innerHTML = `
      <div class="palette-info">
        <span>🎨 Paleta:</span>
        <a href="${escapeHtml(paletteUrl)}" target="_blank" rel="noopener" class="palette-link">
          ${escapeHtml(paletteName)} ↗
        </a>
      </div>
      ${swatchesHtml}
    `;
    card.appendChild(metaBar);

    // Cuadrícula de obras
    const grid = document.createElement('div');
    grid.className = 'artworks-grid';

    const submissions = challenge.submissions || [];
    let artworksCount = 0;

    submissions.forEach(sub => {
      // Si el autor está filtrado y no coincide, saltar
      if (state.selectedAuthor !== 'all' && sub.author !== state.selectedAuthor) {
        return;
      }

      (sub.images || []).forEach(img => {
        artworksCount++;
        const artworkCard = createArtworkCard(challenge, sub, img);
        grid.appendChild(artworkCard);
      });
    });

    if (artworksCount === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem 1rem;">
          <p>Aún no hay obras subidas para esta semana. ¡Sé el primero en enviar un Pull Request! 🎨</p>
        </div>
      `;
    }

    card.appendChild(grid);
    return card;
  }

  function createArtworkCard(challenge, submission, image) {
    const card = document.createElement('div');
    card.className = 'artwork-card';

    // Frame
    const frame = document.createElement('div');
    frame.className = 'artwork-frame checker-bg';
    frame.title = 'Haz clic para ampliar con zoom pixel-perfect';

    const imgEl = document.createElement('img');
    imgEl.src = image.path;
    imgEl.alt = `${challenge.theme} por @${submission.author}`;
    imgEl.className = 'pixel-art-view';
    imgEl.loading = 'lazy';
    imgEl.onerror = () => {
      if (!imgEl.dataset.fallbackTried) {
        imgEl.dataset.fallbackTried = 'true';
        imgEl.src = '../' + image.path;
      }
    };

    frame.appendChild(imgEl);
    frame.addEventListener('click', () => {
      openModal(challenge, submission, image);
    });

    // Footer con autor y botón de descarga o fuente
    const footer = document.createElement('div');
    footer.className = 'artwork-footer';

    const authorLink = document.createElement('span');
    authorLink.className = 'author-pill';
    authorLink.textContent = `@${submission.author}`;
    footer.appendChild(authorLink);

    const actions = document.createElement('div');
    actions.className = 'artwork-actions';

    // Si tiene archivo fuente (.aseprite)
    if (submission.sources && submission.sources.length > 0) {
      const source = submission.sources[0];
      const srcBtn = document.createElement('a');
      srcBtn.href = source.path;
      srcBtn.download = source.filename;
      srcBtn.className = 'btn-icon';
      srcBtn.title = `Descargar archivo fuente (${source.filename})`;
      srcBtn.innerHTML = '💾 .ase';
      actions.appendChild(srcBtn);
    }

    // Botón ampliar
    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'btn-icon';
    zoomBtn.title = 'Ver en grande';
    zoomBtn.innerHTML = '🔍';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(challenge, submission, image);
    });
    actions.appendChild(zoomBtn);

    footer.appendChild(actions);

    card.appendChild(frame);
    card.appendChild(footer);
    return card;
  }

  // Modal Functions
  function openModal(challenge, submission, image) {
    state.currentModalItem = { challenge, submission, image };

    modalImage.src = image.path;
    modalImage.onerror = () => {
      if (!modalImage.dataset.fallbackTried) {
        modalImage.dataset.fallbackTried = 'true';
        modalImage.src = '../' + image.path;
      }
    };
    modalImage.alt = image.filename;
    modalWeek.textContent = `${challenge.week.toUpperCase()} · ${challenge.year}`;
    modalTitle.textContent = image.filename;
    modalAuthorName.textContent = `@${submission.author}`;
    modalTheme.textContent = challenge.theme || 'Libre';
    modalPalette.textContent = challenge.palette?.name || 'Lospec';

    // Acciones del modal
    modalActions.innerHTML = `
      <a href="${escapeHtml(image.path)}" download="${escapeHtml(image.filename)}" class="retro-btn" style="text-align: center; justify-content: center;">
        ⬇️ Descargar PNG
      </a>
      ${submission.sources && submission.sources.length > 0 ? `
        <a href="${escapeHtml(submission.sources[0].path)}" download="${escapeHtml(submission.sources[0].filename)}" class="retro-btn btn-secondary" style="text-align: center; justify-content: center;">
          💾 Descargar ${escapeHtml(submission.sources[0].filename)}
        </a>
      ` : ''}
    `;

    setModalZoom(state.currentZoom);
    setModalBg(state.currentBg);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalImage.src = '';
  }

  function setModalZoom(zoomFactor) {
    state.currentZoom = zoomFactor;
    // Base 32px multiplicado por el factor (o escalado relativo)
    // Para 32x32: 2x=64px, 4x=128px, 8x=256px, 12x=384px, 16x=512px
    const pxSize = 32 * zoomFactor;
    modalImage.style.width = `${pxSize}px`;
    modalImage.style.height = `${pxSize}px`;
  }

  function setModalBg(bgType) {
    state.currentBg = bgType;
    modalCanvasWrapper.className = 'modal-preview-wrapper';
    if (bgType === 'checker') {
      modalCanvasWrapper.classList.add('checker-bg');
    } else if (bgType === 'dark') {
      modalCanvasWrapper.classList.add('bg-dark');
    } else if (bgType === 'light') {
      modalCanvasWrapper.classList.add('bg-light');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderFallback() {
    galleryContainer.innerHTML = `
      <div class="empty-state">
        <p>⚠️ No se pudo cargar el archivo <code>data.json</code>.</p>
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Si estás ejecutando en local, puedes abrir un servidor estático con <code>python3 -m http.server</code> dentro de <code>docs/</code>.</p>
      </div>
    `;
  }

  // Inicio
  loadGalleryData();
});
