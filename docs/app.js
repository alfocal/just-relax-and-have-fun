/**
 * Just Relax and Have Fun - Pixel Art Gallery App
 */

document.addEventListener('DOMContentLoaded', () => {
  // Tamaño aproximado (px) al que se amplían en las tarjetas las imágenes pequeñas
  const CARD_IMAGE_SIZE = 192;
  // Máximo de colores por fila en la muestra de la paleta
  const MAX_SWATCH_COLUMNS = 16;
  // Vistas en movimiento de una obra (además de la estática): etiqueta del botón de la tarjeta y su título
  const MOVING_VIEWS = [
    { view: 'animation', badge: 'GIF', title: 'la animación' },
    { view: 'timelapse', badge: 'TIMELAPSE', title: 'el timelapse del proceso' }
  ];

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
  const viewControl = document.getElementById('view-control');
  const viewButtons = document.getElementById('view-buttons');

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
        count += (s.artworks || []).length;
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

    // Imagen estática / GIF animado / timelapse (solo los que tenga la obra)
    viewButtons.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        setModalView(btn.dataset.view);
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
          (s.artworks || []).some(art => art.name.toLowerCase().includes(q))
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
      // Cuadrícula con filas equilibradas: 64 colores → 4 × 16, 60 → 4 × 15, 12 → 1 × 12
      const rows = Math.ceil(colors.length / MAX_SWATCH_COLUMNS);
      const columns = Math.ceil(colors.length / rows);
      swatchesHtml = `
        <div class="swatches-container" title="Colores de la paleta" style="--swatch-columns: ${columns}">
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

      (sub.artworks || []).forEach(artwork => {
        artworksCount++;
        const artworkCard = createArtworkCard(challenge, sub, artwork);
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

  function createArtworkCard(challenge, submission, artwork) {
    // Las obras se ven quietas hasta que se pulsa ▶ GIF o ▶ TIMELAPSE
    let view = 'still';
    const card = document.createElement('div');
    card.className = 'artwork-card';

    // Frame
    const frame = document.createElement('div');
    frame.className = 'artwork-frame checker-bg';
    frame.title = 'Haz clic para ampliar con zoom pixel-perfect';

    const imgEl = document.createElement('img');
    imgEl.alt = `${challenge.theme} por @${submission.author}`;
    imgEl.className = 'pixel-art-view';
    imgEl.loading = 'lazy';
    imgEl.style.width = cardImageWidth([artwork.image, artwork.animation, artwork.timelapse]);
    showArtworkImage(imgEl, artwork, view);
    frame.appendChild(imgEl);

    // Un botón por vista en movimiento: pulsarlo la pone y pulsarlo otra vez vuelve a la estática
    const views = MOVING_VIEWS.filter(v => viewFile(artwork, v.view));
    if (views.length > 0) {
      const viewsBar = document.createElement('div');
      viewsBar.className = 'artwork-views';
      const buttons = views.map(v => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'artwork-badge';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          view = view === v.view ? 'still' : v.view;
          updateButtons();
          showArtworkImage(imgEl, artwork, view);
        });
        viewsBar.appendChild(btn);
        return btn;
      });
      const updateButtons = () => {
        views.forEach((v, i) => {
          const active = view === v.view;
          buttons[i].textContent = `${active ? '⏸' : '▶'} ${v.badge}`;
          buttons[i].title = active ? 'Ver la imagen estática' : `Ver ${v.title}`;
          buttons[i].setAttribute('aria-pressed', active);
        });
      };
      updateButtons();
      frame.appendChild(viewsBar);
    }
    frame.addEventListener('click', () => {
      openModal(challenge, submission, artwork, view);
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

    // Archivos fuente de este diseño (.aseprite, .psd...)
    (artwork.sources || []).forEach(source => {
      const srcBtn = document.createElement('a');
      srcBtn.href = assetUrl(source.path);
      srcBtn.download = source.filename;
      srcBtn.className = 'btn-icon';
      srcBtn.title = `Descargar archivo fuente (${source.filename})`;
      srcBtn.textContent = `💾 ${source.filename.slice(source.filename.lastIndexOf('.'))}`;
      actions.appendChild(srcBtn);
    });

    // Botón ampliar
    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'btn-icon btn-zoom';
    zoomBtn.title = 'Ver en grande';
    zoomBtn.innerHTML = '🔍';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(challenge, submission, artwork, view);
    });
    actions.appendChild(zoomBtn);

    footer.appendChild(actions);

    card.appendChild(frame);
    card.appendChild(footer);
    return card;
  }

  // Modal Functions
  // Se abre con la obra como estuviera en su tarjeta: quieta, animada o con el timelapse
  function openModal(challenge, submission, artwork, view = 'still') {
    const image = artwork.image;
    state.currentModalItem = { challenge, submission, artwork };

    viewButtons.querySelectorAll('button').forEach(btn => {
      btn.hidden = !viewFile(artwork, btn.dataset.view);
    });
    viewControl.hidden = !MOVING_VIEWS.some(v => viewFile(artwork, v.view));
    setModalView(view);
    modalImage.alt = image.filename;
    modalWeek.textContent = `${challenge.week.toUpperCase()} · ${challenge.year}`;
    modalTitle.textContent = artwork.name;
    modalAuthorName.textContent = `@${submission.author}`;
    modalTheme.textContent = challenge.theme || 'Libre';
    modalPalette.textContent = challenge.palette?.name || 'Lospec';

    // Acciones del modal: la imagen, su GIF, su timelapse, sus otras versiones (p. ej. 32x32) y sus archivos fuente
    const downloadLink = (file, icon, extraClass) => `
      <a href="${escapeHtml(assetUrl(file.path))}" download="${escapeHtml(file.filename)}" class="retro-btn ${extraClass}" style="text-align: center; justify-content: center;">
        ${icon} Descargar ${escapeHtml(file.filename)}
      </a>
    `;
    modalActions.innerHTML = [
      ...[image, artwork.animation, artwork.timelapse, ...(artwork.variants || [])].filter(Boolean).map(file => downloadLink(file, '⬇️', '')),
      ...(artwork.sources || []).map(file => downloadLink(file, '💾', 'btn-secondary'))
    ].join('');

    setModalZoom(state.currentZoom);
    setModalBg(state.currentBg);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    // Quitar el src (en vez de vaciarlo) evita que salte onerror y pida una ruta inexistente
    modalImage.onerror = null;
    modalImage.removeAttribute('src');
    delete modalImage.dataset.request;
  }

  function setModalView(view) {
    viewButtons.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    showArtworkImage(modalImage, state.currentModalItem.artwork, view);
  }

  function setModalZoom(zoomFactor) {
    state.currentZoom = zoomFactor;
    // Base 32px multiplicado por el factor (o escalado relativo)
    // Para 32x32: 2x=64px, 4x=128px, 8x=256px, 12x=384px, 16x=512px
    // Solo el ancho: el alto sale del aspect-ratio y así, si no cabe, se reduce sin deformarse
    const pxSize = 32 * zoomFactor;
    modalImage.style.width = `${pxSize}px`;
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

  // Archivo de cada vista de la obra (null si no la tiene): 'still' es la imagen estática;
  // 'animation', su GIF animado (si solo hay GIF, la propia imagen); 'timelapse', el del proceso
  function viewFile(artwork, view) {
    if (view === 'animation') return artwork.animation || (artwork.image.animated ? artwork.image : null);
    if (view === 'timelapse') return artwork.timelapse || null;
    return artwork.image;
  }

  // Ancho de la obra en la tarjeta: las imágenes pequeñas (p. ej. un GIF exportado a 32×32) se amplían
  // a un múltiplo entero de su tamaño hasta unos CARD_IMAGE_SIZE px. Se calcula con la versión más
  // pequeña para que todas las vistas (estática, GIF, timelapse) se vean igual de grandes al alternar.
  function cardImageWidth(files) {
    const sized = files.filter(file => file && file.width && file.height);
    if (sized.length === 0) return '';
    const base = sized.reduce((a, b) => (b.width < a.width ? b : a));
    const scale = Math.max(1, Math.floor(CARD_IMAGE_SIZE / Math.max(base.width, base.height)));
    return `${base.width * scale}px`;
  }

  // Pone en imgEl una vista de la obra. Si la obra solo tiene el GIF, la versión
  // estática es su primer fotograma.
  let imageRequests = 0;
  function showArtworkImage(imgEl, artwork, view) {
    const file = viewFile(artwork, view);
    // Si se cambia de imagen antes de que llegue el primer fotograma, este se descarta
    const request = imgEl.dataset.request = String(++imageRequests);
    if (view !== 'still' || !file.animated) {
      setPixelArtSrc(imgEl, file.path);
      return;
    }
    firstFrameUrl(file.path).then(url => {
      if (imgEl.dataset.request !== request) return;
      imgEl.onerror = null;
      imgEl.src = url;
    });
  }

  // Primer fotograma de cada GIF, dibujado en un canvas (se guarda para no repetirlo)
  const firstFrames = new Map();
  function firstFrameUrl(path) {
    if (!firstFrames.has(path)) {
      firstFrames.set(path, new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL());
        };
        setPixelArtSrc(img, path);
      }));
    }
    return firstFrames.get(path);
  }

  // Pide la imagen en PixelArt/... y, si falla (raíz del repo servida con http.server), en ../PixelArt/...
  function setPixelArtSrc(imgEl, path) {
    let fallbackTried = false;
    imgEl.onerror = () => {
      if (!fallbackTried) {
        fallbackTried = true;
        imgEl.src = '../' + assetUrl(path);
      }
    };
    imgEl.src = assetUrl(path);
  }

  // Codifica cada tramo de la ruta para que funcionen nombres con espacios, # o ?
  function assetUrl(path) {
    return path.split('/').map(encodeURIComponent).join('/');
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
        <p style="margin-top: 0.5rem; font-size: 0.85rem;">Si estás ejecutando en local, genera el índice con <code>python3 scripts/build_gallery.py</code>, sirve la raíz del repositorio con <code>python3 -m http.server</code> y abre <code>/docs/</code>.</p>
      </div>
    `;
  }

  // Inicio
  loadGalleryData();
});
