/* ================================================================
   PAGE /recherche — CamProtect v1.0.0
   Hébergé sur GitHub Pages : camprotect-outils/recherche.js
   Cache-busting via ?v=X.Y.Z dans l'embed Webflow
   Dépendance : Fuse.js (chargé dans l'embed avant ce fichier)
   ================================================================ */

(function () {
'use strict';

function init() {

// ============= UTILS =============
function normalize(str) {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
}
function debounce(fn, wait) {
  let t;
  return function () {
    const ctx = this, args = arguments;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(ctx, args), wait);
  };
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
function ga4(eventName, params) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
    else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    }
  } catch (e) {}
}

// ============= SYNONYMES =============
const SYNONYM_GROUPS = [
  ['detecteur', 'capteur', 'sensor'],
  ['bullet', 'tubulaire', 'tube'],
  ['camera', 'cam', 'cameras'],
  ['dome', 'domecam', 'boule'],
  ['tourelle', 'turret', 'turretcam'],
  ['poe', 'power over ethernet'],
  ['kit', 'pack', 'ensemble'],
  ['enregistreur', 'nvr', 'dvr', 'xvr', 'recorder'],
  ['ajax', 'jeweller', 'fibra'],
  ['hub', 'centrale', 'panneau'],
  ['sirene', 'buzzer'],
  ['ouverture', 'porte', 'fenetre', 'contact'],
  ['mouvement', 'pir', 'motion'],
  ['incendie', 'fumee', 'feu'],
  ['switch', 'commutateur'],
  ['rj45', 'ethernet'],
  ['coaxial', 'kx6', 'rg59', 'rg6'],
  ['support', 'fixation', 'bracket', 'equerre'],
  ['ecran', 'moniteur'],
  ['disque dur', 'hdd', 'stockage'],
  ['onduleur', 'ups'],
  ['wifi', 'wi-fi'],
  ['clavier', 'keypad'],
  ['telecommande', 'bouton panique']
];
const SYNONYM_MAP = (function () {
  const map = new Map();
  SYNONYM_GROUPS.forEach(group => {
    const norm = group.map(w => normalize(w));
    norm.forEach(w => {
      if (!map.has(w)) map.set(w, new Set());
      norm.forEach(o => map.get(w).add(o));
    });
  });
  return map;
})();
function expandTokenWithSynonyms(token) {
  const n = normalize(token);
  return SYNONYM_MAP.has(n) ? Array.from(SYNONYM_MAP.get(n)) : [n];
}

// ============= FUSE CONFIG =============
const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.55 },
    { name: 'productref', weight: 0.25 },
    { name: 'brand', weight: 0.15 },
    { name: 'description', weight: 0.12 },
    { name: 'altwords', weight: 0.12 },
    { name: 'productType', weight: 0.1 },
    { name: 'cameraForm', weight: 0.08 },
    { name: 'categorie1', weight: 0.06 },
    { name: 'categorie2', weight: 0.06 },
    { name: 'compatibilite', weight: 0.04 },
    { name: 'couleur', weight: 0.04 },
    { name: 'environnement', weight: 0.04 },
    { name: 'technologie', weight: 0.04 }
  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true
};
function normalizeData(data) {
  return data.map(item => ({
    original: item,
    title: normalize(item.title),
    description: normalize(item.description),
    altwords: normalize(item.altwords),
    brand: normalize(item.brand),
    productref: normalize(item.productref),
    productType: normalize(item.productType),
    cameraForm: normalize(item.cameraForm),
    categorie1: normalize(item.categorie1),
    categorie2: normalize(item.categorie2),
    compatibilite: normalize(item.compatibilite),
    alimentation: normalize(item.alimentation),
    communication: normalize(item.communication),
    couleur: normalize(item.couleur),
    environnement: normalize(item.environnement),
    iacamera: normalize(item.iacamera),
    micro: normalize(item.micro),
    technologie: normalize(item.technologie)
  }));
}

// ============= CACHE =============
const CACHE_KEY = 'cp_search_data_v2';
const CACHE_TTL = 60 * 60 * 1000;
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.at || Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed;
  } catch (e) { return null; }
}
function saveCache(meta, products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      at: Date.now(),
      generated: meta && meta.generated,
      products: products
    }));
  } catch (e) {}
}

// ============= MAPPING productType → tokens =============
const INTENT_TO_PRODUCT_TYPE = new Map();
function registerIntent(tokens, productTypeNorm) {
  tokens.forEach(t => {
    const n = normalize(t);
    if (!INTENT_TO_PRODUCT_TYPE.has(n)) INTENT_TO_PRODUCT_TYPE.set(n, new Set());
    INTENT_TO_PRODUCT_TYPE.get(n).add(productTypeNorm);
  });
}
function buildIntentMap(products) {
  INTENT_TO_PRODUCT_TYPE.clear();
  const uniquePT = new Set();
  products.forEach(p => {
    const pt = normalize(p.productType);
    if (pt) uniquePT.add(pt);
  });
  uniquePT.forEach(pt => {
    pt.split(/\s+/).forEach(tok => {
      if (tok.length > 2) registerIntent([tok], pt);
    });
    registerIntent([pt], pt);
    pt.split(/\s+/).forEach(tok => {
      const syns = expandTokenWithSynonyms(tok);
      if (syns.length > 1) registerIntent(syns, pt);
    });
  });
  const INTENT_OVERRIDES = [
    { tokens: ['camera', 'cam', 'cameras'], pt: 'camera' },
    { tokens: ['enregistreur', 'nvr', 'dvr', 'xvr'], pt: 'enregistreur' },
    { tokens: ['detecteur', 'capteur'], pt: 'detecteur' },
    { tokens: ['sirene'], pt: 'sirene' },
    { tokens: ['clavier', 'keypad'], pt: 'clavier' },
    { tokens: ['switch', 'commutateur'], pt: 'switch' },
    { tokens: ['ecran', 'moniteur'], pt: 'ecran' },
    { tokens: ['onduleur', 'ups'], pt: 'onduleur' }
  ];
  INTENT_OVERRIDES.forEach(({ tokens, pt }) => {
    uniquePT.forEach(realPt => {
      if (realPt.includes(pt)) registerIntent(tokens, realPt);
    });
  });
}
function detectTargetProductTypes(query) {
  const tokens = normalize(query).split(/\s+/).filter(t => t.length > 1);
  const targets = new Set();
  tokens.forEach(tok => {
    if (INTENT_TO_PRODUCT_TYPE.has(tok)) {
      INTENT_TO_PRODUCT_TYPE.get(tok).forEach(pt => targets.add(pt));
    }
  });
  return targets.size > 0 ? targets : null;
}

// ============= RECHERCHE =============
function runSearch(fuse, rawQuery, products) {
  const tokens = normalize(rawQuery).split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return { primary: [], accessories: [], targetPTs: null };
  const expanded = tokens.map(t => expandTokenWithSynonyms(t));
  const accumulated = new Map();
  expanded.forEach(group => {
    const groupBest = new Map();
    group.forEach(term => {
      fuse.search(term).forEach(r => {
        const pid = r.item.original.url || r.item.original.slug;
        if (!pid) return;
        const existing = groupBest.get(pid);
        if (!existing || r.score < existing.score) groupBest.set(pid, r);
      });
    });
    groupBest.forEach((r, pid) => {
      if (!accumulated.has(pid)) {
        accumulated.set(pid, { r, totalScore: r.score, groupsHit: 1 });
      } else {
        const acc = accumulated.get(pid);
        acc.totalScore += r.score;
        acc.groupsHit += 1;
      }
    });
  });
  const requiredGroups = expanded.length;
  const all = [];
  accumulated.forEach(acc => {
    if (acc.groupsHit === requiredGroups) {
      all.push({ item: acc.r.item, score: acc.totalScore / requiredGroups });
    }
  });
  all.sort((a, b) => a.score - b.score);

  const targetPTs = detectTargetProductTypes(rawQuery);
  if (!targetPTs) return { primary: all, accessories: [], targetPTs: null };

  const primary = [], accessories = [];
  all.forEach(r => {
    const pt = normalize(r.item.original.productType);
    if (pt && targetPTs.has(pt)) primary.push(r);
    else accessories.push(r);
  });
  return { primary, accessories, targetPTs };
}

// ============= HIGHLIGHTING =============
function buildHighlightRegex(rawQuery) {
  const tokens = normalize(rawQuery).split(/\s+/).filter(t => t.length > 1);
  if (!tokens.length) return null;
  const all = [];
  tokens.forEach(t => expandTokenWithSynonyms(t).forEach(s => all.push(s)));
  const escaped = [...new Set(all)]
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);
  if (!escaped.length) return null;
  return new RegExp('(' + escaped.join('|') + ')', 'gi');
}
function highlight(text, regex) {
  if (!text) return '';
  const safe = escapeHtml(text);
  if (!regex) return safe;
  const nt = normalize(text);
  const matches = [];
  let m;
  const re = new RegExp(regex.source, regex.flags);
  while ((m = re.exec(nt)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (!matches.length) return safe;
  let out = '', cursor = 0;
  matches.forEach(({ start, end }) => {
    out += escapeHtml(text.slice(cursor, start)) + '<mark>' + escapeHtml(text.slice(start, end)) + '</mark>';
    cursor = end;
  });
  out += escapeHtml(text.slice(cursor));
  return out;
}

// ============= STATE =============
const PAGE_SIZE = 12;
let allResults = [];
let allAccessories = [];
let displayed = 0;
let highlightRegex = null;
let sortMode = 'relevance';
let keywordCorpus = [];
const activeFilters = {
  brands: new Set(),
  categories: new Set(),
  colors: new Set(),
  priceMin: null,
  priceMax: null
};
let priceBounds = { min: 0, max: 0 };

// ============= DOM =============
const params = new URLSearchParams(window.location.search);
const query = (params.get("query") || "").trim();
const pageWrapper       = document.getElementById("searchResultsPage");
const titleEl           = document.getElementById("searchTitle");
const countEl           = document.getElementById("searchCount");
const resultsList       = document.getElementById("Result_List");
const brandFiltersEl    = document.getElementById("brandFilters");
const categoryFiltersEl = document.getElementById("categoryFilters");
const colorFiltersEl    = document.getElementById("colorFilters");
const resetBtn          = document.getElementById("resetFilters");
const loadMoreWrapper   = document.getElementById("loadMoreWrapper");
const loadMoreBtn       = document.getElementById("loadMoreBtn");
const sortHost          = document.getElementById("sortDropdownHost");
const priceInputsHost   = document.getElementById("priceInputsHost");
const priceRangeDisplay = document.getElementById("priceRangeDisplay");
const openFiltersBtn    = document.getElementById("openFiltersMobile");
const mobileFilterCount = document.getElementById("mobileFilterCount");
const sidebar           = document.getElementById("searchFilters");
const relatedSection    = document.getElementById("relatedAccessories");
const relatedList       = document.getElementById("relatedAccessoriesList");

if (!resultsList) return;
if (countEl) { countEl.setAttribute('role', 'status'); countEl.setAttribute('aria-live', 'polite'); }

// ============= INJECTION DYNAMIQUE =============
const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Pertinence' },
  { value: 'price-asc',  label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'name-asc',   label: 'Nom (A → Z)' }
];
if (sortHost) {
  sortHost.innerHTML =
    '<div class="sort-dropdown">' +
      '<button type="button" class="sort-dropdown-btn" aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="sort-dropdown-label">Pertinence</span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
      '</button>' +
      '<div class="sort-dropdown-menu" role="listbox">' +
        SORT_OPTIONS.map(o =>
          '<div class="sort-dropdown-option' + (o.value === 'relevance' ? ' is-active' : '') + '" role="option" data-value="' + o.value + '">' + o.label + '</div>'
        ).join('') +
      '</div>' +
    '</div>';
}
if (priceInputsHost) {
  priceInputsHost.innerHTML =
    '<div class="price-slider" id="priceSlider">' +
      '<div class="price-slider__track"></div>' +
      '<div class="price-slider__range" id="priceSliderRange"></div>' +
      '<input type="range" id="priceMin" min="0" max="100" value="0" step="1" aria-label="Prix minimum">' +
      '<input type="range" id="priceMax" min="0" max="100" value="100" step="1" aria-label="Prix maximum">' +
    '</div>' +
    '<div class="price-slider__values">' +
      '<span id="priceMinLabel">0 €</span>' +
      '<span id="priceMaxLabel">0 €</span>' +
    '</div>';
}
if (sidebar) {
  const overlay = document.createElement('div');
  overlay.id = 'filterDrawerOverlay';
  document.body.appendChild(overlay);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'drawer-close-btn';
  closeBtn.setAttribute('aria-label', 'Fermer les filtres');
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  sidebar.insertBefore(closeBtn, sidebar.firstChild);
}

// ============= URL STATE =============
function stateToUrl() {
  const p = new URLSearchParams();
  if (query) p.set('query', query);
  if (activeFilters.brands.size)     p.set('brand',    Array.from(activeFilters.brands).join(','));
  if (activeFilters.categories.size) p.set('category', Array.from(activeFilters.categories).join(','));
  if (activeFilters.colors.size)     p.set('color',    Array.from(activeFilters.colors).join(','));
  if (activeFilters.priceMin != null) p.set('pmin', String(activeFilters.priceMin));
  if (activeFilters.priceMax != null) p.set('pmax', String(activeFilters.priceMax));
  if (sortMode !== 'relevance') p.set('sort', sortMode);
  window.history.replaceState({}, '', window.location.pathname + '?' + p.toString());
}
function loadStateFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const readSet = k => { const v = p.get(k); return v ? new Set(v.split(',').filter(Boolean)) : new Set(); };
  activeFilters.brands     = readSet('brand');
  activeFilters.categories = readSet('category');
  activeFilters.colors     = readSet('color');
  const pmin = p.get('pmin'), pmax = p.get('pmax');
  activeFilters.priceMin = pmin ? parseFloat(pmin) : null;
  activeFilters.priceMax = pmax ? parseFloat(pmax) : null;
  sortMode = p.get('sort') || 'relevance';
}

// ============= HELPERS =============
function clearCards() {
  resultsList.querySelectorAll('.search-result-item, .search-state, .search-skeleton').forEach(el => el.remove());
}
function renderSkeletons(n) {
  clearCards();
  for (let i = 0; i < n; i++) {
    resultsList.insertAdjacentHTML('beforeend',
      '<div class="search-skeleton"><div class="skeleton-img"></div>' +
      '<div class="skeleton-body">' +
        '<div class="skeleton-line w-40"></div>' +
        '<div class="skeleton-line w-80"></div>' +
        '<div class="skeleton-line w-60"></div>' +
        '<div class="skeleton-line w-30"></div>' +
      '</div></div>');
  }
}
function setTitle(raw, highlighted) {
  if (!titleEl) return;
  if (highlighted) titleEl.innerHTML = raw.replace('%s', '<em>« ' + escapeHtml(highlighted) + ' »</em>');
  else titleEl.textContent = raw;
}
function setCount(n) {
  if (!countEl) return;
  if (n === 0) countEl.textContent = "Aucun produit trouvé";
  else if (n === 1) countEl.textContent = "1 produit trouvé";
  else countEl.textContent = n + " produits trouvés";
}
function toggleGroup(containerEl, isVisible) {
  if (!containerEl) return;
  const group = containerEl.closest('.Result_filter-group, .result_filter-group');
  if (!group) return;
  if (isVisible) group.classList.remove('is-hidden');
  else group.classList.add('is-hidden');
}
function countActiveFilters() {
  return activeFilters.brands.size + activeFilters.categories.size + activeFilters.colors.size
    + (activeFilters.priceMin != null ? 1 : 0)
    + (activeFilters.priceMax != null ? 1 : 0);
}
function updateMobileFilterBadge() {
  if (!mobileFilterCount) return;
  const n = countActiveFilters();
  mobileFilterCount.textContent = n > 0 ? String(n) : '';
}
function shortSpec(str) {
  if (!str) return '';
  const s = String(str).trim();
  return s.split(/[·(]|\s+[–—-]\s+|,/)[0].trim();
}
function priceTtcFromItem(item) {
  const raw = typeof item.prix_ht === 'number' ? item.prix_ht : parseFloat(String(item.prix_ht || '').replace(',', '.'));
  if (isNaN(raw) || raw <= 0) return null;
  return raw * 1.2;
}

// ============= FACETTES =============
function buildFacet(results, fieldName) {
  const map = new Map();
  results.forEach(r => {
    const raw = (r.item.original[fieldName] || '').trim();
    if (!raw) return;
    const key = normalize(raw);
    if (!key) return;
    if (!map.has(key)) map.set(key, { label: raw, count: 0, labels: {} });
    const e = map.get(key);
    e.count += 1;
    e.labels[raw] = (e.labels[raw] || 0) + 1;
  });
  map.forEach(e => {
    let best = e.label, bc = 0;
    Object.keys(e.labels).forEach(l => { if (e.labels[l] > bc) { bc = e.labels[l]; best = l; } });
    e.label = best;
    delete e.labels;
  });
  return map;
}
function computePriceBounds(results) {
  let min = Infinity, max = 0;
  results.forEach(r => {
    const p = priceTtcFromItem(r.item.original);
    if (p == null) return;
    if (p < min) min = p;
    if (p > max) max = p;
  });
  if (min === Infinity) return { min: 0, max: 0 };
  return { min: Math.floor(min), max: Math.ceil(max) };
}
function renderFilterGroup(containerEl, facetMap, filterKey) {
  if (!containerEl) return false;
  const entries = [...facetMap.entries()].sort((a, b) => b[1].count - a[1].count);
  if (entries.length < 2) { toggleGroup(containerEl, false); containerEl.innerHTML = ''; return false; }
  toggleGroup(containerEl, true);
  containerEl.innerHTML = '';
  const stateSet = activeFilters[filterKey === 'category' ? 'categories' : filterKey === 'color' ? 'colors' : 'brands'];
  entries.forEach(([key, data]) => {
    const id = 'f-' + filterKey + '-' + key.replace(/\W/g, '');
    const checked = stateSet.has(key);
    containerEl.insertAdjacentHTML('beforeend',
      '<label for="' + id + '">' +
        '<input type="checkbox" id="' + id + '" value="' + escapeHtml(key) + '" data-filter="' + filterKey + '"' + (checked ? ' checked' : '') + '>' +
        '<span>' + escapeHtml(data.label) + '</span>' +
        '<span class="Result_filter-count">' + data.count + '</span>' +
      '</label>');
  });
  return true;
}
function updatePriceSliderUI() {
  const minInput = document.getElementById('priceMin');
  const maxInput = document.getElementById('priceMax');
  const range    = document.getElementById('priceSliderRange');
  const minLabel = document.getElementById('priceMinLabel');
  const maxLabel = document.getElementById('priceMaxLabel');
  if (!minInput || !maxInput) return;
  const min = parseInt(minInput.min, 10);
  const max = parseInt(minInput.max, 10);
  const v1 = parseInt(minInput.value, 10);
  const v2 = parseInt(maxInput.value, 10);
  const span = max - min || 1;
  const left = ((v1 - min) / span) * 100;
  const right = ((v2 - min) / span) * 100;
  if (range) { range.style.left = left + '%'; range.style.width = (right - left) + '%'; }
  if (minLabel) minLabel.textContent = v1 + ' €';
  if (maxLabel) maxLabel.textContent = v2 + ' €';
}
function renderFilters() {
  const facets = {
    brands:     buildFacet(allResults, 'brand'),
    categories: buildFacet(allResults, 'productType'),
    colors:     buildFacet(allResults, 'couleur')
  };
  const hasBrand = renderFilterGroup(brandFiltersEl,    facets.brands,     'brand');
  const hasCat   = renderFilterGroup(categoryFiltersEl, facets.categories, 'category');
  const hasColor = renderFilterGroup(colorFiltersEl,    facets.colors,     'color');

  priceBounds = computePriceBounds(allResults);
  const priceGroup = document.getElementById('priceFilterGroup');
  if (priceBounds.max > priceBounds.min) {
    if (priceGroup) priceGroup.classList.remove('is-hidden');
    if (priceRangeDisplay) priceRangeDisplay.textContent = 'De ' + priceBounds.min + ' € à ' + priceBounds.max + ' €';
    const minInput = document.getElementById('priceMin');
    const maxInput = document.getElementById('priceMax');
    if (minInput && maxInput) {
      minInput.min = maxInput.min = String(priceBounds.min);
      minInput.max = maxInput.max = String(priceBounds.max);
      minInput.value = String(activeFilters.priceMin != null ? activeFilters.priceMin : priceBounds.min);
      maxInput.value = String(activeFilters.priceMax != null ? activeFilters.priceMax : priceBounds.max);
      updatePriceSliderUI();
    }
  } else {
    if (priceGroup) priceGroup.classList.add('is-hidden');
  }
  const hasAny = hasBrand || hasCat || hasColor || (priceBounds.max > priceBounds.min);
  if (!hasAny) pageWrapper && pageWrapper.classList.add('no-sidebar');
  else pageWrapper && pageWrapper.classList.remove('no-sidebar');
}

// ============= FILTRAGE =============
function productMatchesFilters(item) {
  const b = normalize(item.brand || '');
  const c = normalize(item.productType || '');
  const col = normalize(item.couleur || '');
  if (activeFilters.brands.size && !activeFilters.brands.has(b)) return false;
  if (activeFilters.categories.size && !activeFilters.categories.has(c)) return false;
  if (activeFilters.colors.size && !activeFilters.colors.has(col)) return false;
  const p = priceTtcFromItem(item);
  if (activeFilters.priceMin != null && (p == null || p < activeFilters.priceMin)) return false;
  if (activeFilters.priceMax != null && (p == null || p > activeFilters.priceMax)) return false;
  return true;
}
function getFilteredResults() {
  const filtered = allResults.filter(r => productMatchesFilters(r.item.original));
  if (sortMode === 'price-asc') filtered.sort((a, b) => (priceTtcFromItem(a.item.original) || Infinity) - (priceTtcFromItem(b.item.original) || Infinity));
  else if (sortMode === 'price-desc') filtered.sort((a, b) => (priceTtcFromItem(b.item.original) || -Infinity) - (priceTtcFromItem(a.item.original) || -Infinity));
  else if (sortMode === 'name-asc') filtered.sort((a, b) => a.item.original.title.localeCompare(b.item.original.title));
  return filtered;
}
function applyFilters(source) {
  const filtered = getFilteredResults();
  displayed = 0;
  renderCards(filtered, true);
  setCount(filtered.length);
  stateToUrl();
  updateMobileFilterBadge();
  ga4('filter_applied', { search_term: query, filter_source: source || 'unknown', results_count: filtered.length });
}

// ============= CARTES =============
function buildSpecs(item) {
  const specs = [];
  const push = v => { if (!v) return; const s = shortSpec(v); if (s) specs.push(s); };
  push(item.resolution);
  push(item.ir_portee);
  push(item.canaux);
  push(item.compression);
  if (item.peripheriques_max) specs.push('Jusqu\'à ' + item.peripheriques_max + ' périph.');
  push(item.acoustique_db);
  push(item.ip);
  push(item.environnement);
  push(item.couleur);
  push(item.technologie);
  const seen = new Set(), out = [];
  for (const s of specs) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}
function buildCard(item, position) {
  const brand = (item.brand || '').trim();
  const cat = (item.productType || '').trim();
  const priceTtc = priceTtcFromItem(item);
  const priceStr = priceTtc != null ? priceTtc.toFixed(2).replace('.', ',') + '\u00A0€' : null;
  const ref = item.productref ? String(item.productref).trim() : '';
  const warranty = item.garantie ? String(item.garantie).trim() : '';
  const specs = buildSpecs(item);
  const badges = [];
  if (brand) badges.push('<span class="search-badge search-badge-brand">' + escapeHtml(brand) + '</span>');
  if (cat)   badges.push('<span class="search-badge search-badge-cat">'   + escapeHtml(cat)   + '</span>');
  const specsHtml = specs.length
    ? '<div class="search-result-specs">' + specs.map(s => '<span class="search-spec">' + escapeHtml(s) + '</span>').join('') + '</div>' : '';
  const footerParts = [];
  if (priceStr) footerParts.push('<div class="search-result-price">' + priceStr + '<span class="ttc-label">TTC</span></div>');
  if (warranty) footerParts.push('<div class="search-result-warranty">Garantie ' + escapeHtml(warranty) + '</div>');
  const footerHtml = footerParts.length ? '<div class="search-result-footer">' + footerParts.join('') + '</div>' : '';
  return (
    '<div class="search-result-item" data-position="' + position + '" data-url="' + escapeHtml(item.url) + '" data-title="' + escapeHtml(item.title) + '" data-price="' + (priceTtc != null ? priceTtc.toFixed(2) : '') + '">' +
      '<a href="' + escapeHtml(item.url) + '">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<div class="search-result-text">' +
          (badges.length ? '<div class="search-result-badges">' + badges.join('') + '</div>' : '') +
          '<h3 class="search-result-title">' + highlight(item.title, highlightRegex) + '</h3>' +
          (ref ? '<div class="search-result-ref">Réf : ' + escapeHtml(ref) + '</div>' : '') +
          '<p class="search-result-description">' + highlight(item.description || '', highlightRegex) + '</p>' +
          specsHtml + footerHtml +
        '</div>' +
      '</a>' +
    '</div>'
  );
}
function buildRelatedCard(item) {
  const cat = (item.productType || '').trim();
  const priceTtc = priceTtcFromItem(item);
  const priceStr = priceTtc != null ? priceTtc.toFixed(2).replace('.', ',') + '\u00A0€' : null;
  return (
    '<div class="related-card" data-url="' + escapeHtml(item.url) + '">' +
      '<a href="' + escapeHtml(item.url) + '">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        (cat ? '<div class="related-card-cat">' + escapeHtml(cat) + '</div>' : '') +
        '<div class="related-card-title">' + escapeHtml(item.title) + '</div>' +
        (priceStr ? '<div class="related-card-price">' + priceStr + '<span class="ttc-label">TTC</span></div>' : '') +
      '</a>' +
    '</div>'
  );
}
function renderRelated() {
  if (!relatedSection || !relatedList) return;
  if (allAccessories.length === 0) {
    relatedSection.classList.remove('is-visible');
    return;
  }
  relatedSection.classList.add('is-visible');
  relatedList.innerHTML = allAccessories.slice(0, 8).map(r => buildRelatedCard(r.item.original)).join('');
}
function renderCards(results, reset) {
  if (reset) { clearCards(); displayed = 0; }
  if (results.length === 0 && displayed === 0) {
    const suggestion = findClosestSuggestion(query);
    let html = '<div class="search-state"><h3>Aucun produit ne correspond à votre recherche</h3>';
    if (suggestion && normalize(suggestion) !== normalize(query)) {
      html += '<p>Vouliez-vous dire <button type="button" class="search-suggestion" data-suggest="' + escapeHtml(suggestion) + '">' + escapeHtml(suggestion) + '</button> ?</p>';
    } else {
      html += '<p>Essayez des termes plus généraux ou parcourez notre catalogue complet.</p>';
    }
    html += '</div>';
    resultsList.insertAdjacentHTML('beforeend', html);
    loadMoreWrapper && loadMoreWrapper.classList.remove('is-visible');
    ga4('search_zero_results', { search_term: query });
    return;
  }
  const slice = results.slice(displayed, displayed + PAGE_SIZE);
  slice.forEach((r, i) => resultsList.insertAdjacentHTML('beforeend', buildCard(r.item.original, displayed + i + 1)));
  displayed += slice.length;
  if (loadMoreWrapper) {
    if (displayed < results.length) loadMoreWrapper.classList.add('is-visible');
    else loadMoreWrapper.classList.remove('is-visible');
  }
}

// ============= SUGGESTION =============
function buildKeywordCorpus(products) {
  const words = new Set();
  const add = (s) => {
    if (!s) return;
    normalize(s).split(/\s+/).forEach(w => {
      if (w.length >= 3 && w.length <= 30 && !/^\d+$/.test(w)) words.add(w);
    });
  };
  products.forEach(p => {
    add(p.title);
    add(p.brand);
    add(p.productType);
    add(p.cameraForm);
  });
  ['camera','detecteur','enregistreur','sirene','kit','switch','cable','ecran','hub','centrale','alarme','surveillance','videosurveillance','clavier','keypad','ouverture','mouvement','incendie','onduleur'].forEach(w => words.add(w));
  return Array.from(words).map(w => ({ w }));
}
function findClosestSuggestion(q) {
  if (!keywordCorpus.length) return null;
  const nq = normalize(q);
  if (nq.length < 3) return null;
  const loose = new Fuse(keywordCorpus, { keys: ['w'], threshold: 0.45, includeScore: true, distance: 100 });
  const tokens = nq.split(/\s+/).filter(t => t.length >= 3);
  if (!tokens.length) return null;
  const correctedTokens = tokens.map(tok => {
    const res = loose.search(tok);
    return res.length && res[0].score < 0.4 ? res[0].item.w : tok;
  });
  const candidate = correctedTokens.join(' ');
  return candidate !== nq ? candidate : null;
}

// ============= DRAWER =============
function openDrawer() {
  if (!sidebar) return;
  sidebar.classList.add('is-open');
  document.body.classList.add('filter-drawer-open');
  const o = document.getElementById('filterDrawerOverlay');
  if (o) o.classList.add('is-open');
}
function closeDrawer() {
  if (!sidebar) return;
  sidebar.classList.remove('is-open');
  document.body.classList.remove('filter-drawer-open');
  const o = document.getElementById('filterDrawerOverlay');
  if (o) o.classList.remove('is-open');
}

// ============= INIT =============
if (!query) {
  setTitle('Aucune recherche active');
  setCount(0);
  pageWrapper && pageWrapper.classList.add('no-sidebar');
  clearCards();
  resultsList.insertAdjacentHTML('beforeend',
    '<div class="search-state"><h3>Aucun mot-clé fourni</h3><p>Utilisez la barre de recherche pour commencer.</p></div>');
  return;
}

setTitle('Résultats pour %s', query);
loadStateFromUrl();
renderSkeletons(3);

function processData(products) {
  buildIntentMap(products);
  keywordCorpus = buildKeywordCorpus(products);
  const normalized = normalizeData(products);
  const fuse = new Fuse(normalized, FUSE_OPTIONS);
  const { primary, accessories, targetPTs } = runSearch(fuse, query, normalized);
  allResults = primary;
  allAccessories = accessories;
  highlightRegex = buildHighlightRegex(query);
  renderFilters();
  const filtered = getFilteredResults();
  setCount(filtered.length);
  renderCards(filtered, true);
  renderRelated();
  updateMobileFilterBadge();
  ga4('search', {
    search_term: query,
    results_count: allResults.length,
    accessories_count: allAccessories.length,
    intent_detected: targetPTs ? Array.from(targetPTs).join(',') : 'none'
  });
}

const cached = loadCache();
if (cached && cached.products) {
  processData(cached.products);
  fetch('https://raw.githubusercontent.com/IMS-SX304/camprotect-json/refs/heads/main/data.json')
    .then(r => r.json())
    .then(data => {
      if (data.meta && data.meta.generated !== cached.generated) {
        saveCache(data.meta, data.products || []);
        processData(data.products || []);
      }
    })
    .catch(() => {});
} else {
  fetch('https://raw.githubusercontent.com/IMS-SX304/camprotect-json/refs/heads/main/data.json')
    .then(r => r.json())
    .then(data => {
      const products = data.products || [];
      saveCache(data.meta, products);
      processData(products);
    })
    .catch(err => {
      console.error('Recherche — erreur de chargement :', err);
      clearCards();
      setCount(0);
      pageWrapper && pageWrapper.classList.add('no-sidebar');
      resultsList.insertAdjacentHTML('beforeend',
        '<div class="search-state"><h3>Erreur de chargement</h3><p>Impossible de charger le catalogue. Rechargez la page ou réessayez.</p></div>');
    });
}

// ============= ÉVÉNEMENTS =============
const debouncedApply = debounce(applyFilters, 150);
function bindFilterGroup(container, filterKey, stateSet) {
  if (!container) return;
  container.addEventListener('change', e => {
    if (!e.target.matches('input[data-filter="' + filterKey + '"]')) return;
    if (e.target.checked) stateSet.add(e.target.value);
    else stateSet.delete(e.target.value);
    applyFilters(filterKey);
  });
}
bindFilterGroup(brandFiltersEl,    'brand',    activeFilters.brands);
bindFilterGroup(categoryFiltersEl, 'category', activeFilters.categories);
bindFilterGroup(colorFiltersEl,    'color',    activeFilters.colors);

document.addEventListener('input', e => {
  const isMin = e.target && e.target.id === 'priceMin';
  const isMax = e.target && e.target.id === 'priceMax';
  if (!isMin && !isMax) return;
  const minInput = document.getElementById('priceMin');
  const maxInput = document.getElementById('priceMax');
  if (!minInput || !maxInput) return;
  let v1 = parseInt(minInput.value, 10);
  let v2 = parseInt(maxInput.value, 10);
  if (isMin && v1 > v2 - 1) { minInput.value = String(v2 - 1); v1 = v2 - 1; }
  if (isMax && v2 < v1 + 1) { maxInput.value = String(v1 + 1); v2 = v1 + 1; }
  activeFilters.priceMin = (v1 === parseInt(minInput.min, 10)) ? null : v1;
  activeFilters.priceMax = (v2 === parseInt(minInput.max, 10)) ? null : v2;
  updatePriceSliderUI();
  debouncedApply('price');
});

resetBtn && resetBtn.addEventListener('click', e => {
  e.preventDefault();
  activeFilters.brands.clear();
  activeFilters.categories.clear();
  activeFilters.colors.clear();
  activeFilters.priceMin = null;
  activeFilters.priceMax = null;
  document.querySelectorAll('#brandFilters input, #categoryFilters input, #colorFilters input').forEach(i => i.checked = false);
  const minInput = document.getElementById('priceMin');
  const maxInput = document.getElementById('priceMax');
  if (minInput) minInput.value = minInput.min;
  if (maxInput) maxInput.value = maxInput.max;
  updatePriceSliderUI();
  applyFilters('reset');
});

loadMoreBtn && loadMoreBtn.addEventListener('click', e => {
  e.preventDefault();
  renderCards(getFilteredResults(), false);
});

let scrollLoadTimer = null;
window.addEventListener('scroll', () => {
  if (scrollLoadTimer) return;
  scrollLoadTimer = setTimeout(() => {
    scrollLoadTimer = null;
    if (!loadMoreWrapper || !loadMoreWrapper.classList.contains('is-visible')) return;
    const rect = loadMoreWrapper.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      renderCards(getFilteredResults(), false);
    }
  }, 120);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('.sort-dropdown-btn');
  const opt = e.target.closest('.sort-dropdown-option');
  const dd  = document.querySelector('.sort-dropdown');
  if (btn && dd) {
    dd.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', dd.classList.contains('is-open') ? 'true' : 'false');
  } else if (opt && dd) {
    sortMode = opt.dataset.value;
    dd.querySelectorAll('.sort-dropdown-option').forEach(o => o.classList.remove('is-active'));
    opt.classList.add('is-active');
    const l = dd.querySelector('.sort-dropdown-label');
    if (l) l.textContent = opt.textContent;
    dd.classList.remove('is-open');
    applyFilters('sort');
    ga4('sort_changed', { search_term: query, sort_mode: sortMode });
  } else if (dd && !e.target.closest('.sort-dropdown')) {
    dd.classList.remove('is-open');
  }
});

openFiltersBtn && openFiltersBtn.addEventListener('click', e => { e.preventDefault(); openDrawer(); });
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'filterDrawerOverlay') closeDrawer();
  if (e.target.closest && e.target.closest('.drawer-close-btn')) closeDrawer();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

resultsList.addEventListener('click', e => {
  const sug = e.target.closest('.search-suggestion');
  if (sug) {
    e.preventDefault();
    window.location.href = '/recherche?query=' + encodeURIComponent(sug.dataset.suggest);
  }
});

resultsList.addEventListener('click', e => {
  const card = e.target.closest('.search-result-item');
  if (!card) return;
  ga4('select_item', {
    item_list_name: 'Résultats de recherche',
    search_term: query,
    items: [{ item_id: card.dataset.url, item_name: card.dataset.title, price: parseFloat(card.dataset.price) || 0, index: parseInt(card.dataset.position, 10) || 0 }]
  });
});

const prefetched = new Set();
function bindPrefetch(container) {
  if (!container) return;
  container.addEventListener('mouseover', e => {
    const card = e.target.closest('.search-result-item, .related-card');
    if (!card) return;
    const url = card.dataset.url;
    if (!url || prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }, true);
}
bindPrefetch(resultsList);
bindPrefetch(relatedList);

window.addEventListener('popstate', () => {
  loadStateFromUrl();
  document.querySelectorAll('#brandFilters input, #categoryFilters input, #colorFilters input').forEach(i => {
    const filter = i.dataset.filter;
    const set = activeFilters[filter === 'category' ? 'categories' : filter === 'color' ? 'colors' : 'brands'];
    i.checked = set.has(i.value);
  });
  const minInput = document.getElementById('priceMin');
  const maxInput = document.getElementById('priceMax');
  if (minInput) minInput.value = activeFilters.priceMin != null ? activeFilters.priceMin : minInput.min;
  if (maxInput) maxInput.value = activeFilters.priceMax != null ? activeFilters.priceMax : maxInput.max;
  updatePriceSliderUI();
  applyFilters('popstate');
});

} // end of init()

// Exécution robuste : DOMContentLoaded OU directement si DOM déjà prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
