// frontend/js/app.js
const API_BASE = '/api';
// Frontend always talks to Node backend; Node proxies to Python AI service.
const AI_API_BASE = '';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80';

// --- State ---
let onboardingData = { name: '', email: '', password: '', colors: [], fit: '', budget: '', occasions: [] };
let currentOnboardStep = 1;
const TOTAL_ONBOARD_STEPS = 5;
let favouriteIds = new Set();
let allProducts = [];
let lastAiAnalysis = null; // { product, aiAttributes, productId } from AI image flow

// --- UI / NAVIGATION ---
function showPage(pageId) {
  document.querySelectorAll('.page-view').forEach(page => {
    page.style.display = 'none';
  });
  const page = document.getElementById(pageId);
  if (page) page.style.display = 'block';

  if (pageId === 'shop-page') {
    loadProducts();
    const recsEl = document.getElementById('recsDisplay');
    const outfitEl = document.getElementById('outfitDisplay');
    const recSection = document.getElementById('recommendations-section');
    if (recsEl) {
      recsEl.innerHTML = '<p class="empty-state">Select an item below to see AI outfit recommendations!</p>';
    }
    if (outfitEl) {
      outfitEl.innerHTML = '';
    }
    if (recSection) {
      recSection.classList.add('recs-hidden');
    }
  }

  if (pageId === 'landing-page') {
    document.getElementById('login-section').style.display = 'none';
  }
}

function showLoginForm(show) {
  const loginSection = document.getElementById('login-section');
  if (!loginSection) return;
  loginSection.style.display = show ? 'block' : 'none';
}

function updateOnboardProgress() {
  const pct = (currentOnboardStep / TOTAL_ONBOARD_STEPS) * 100;
  document.documentElement.style.setProperty('--progress-width', pct + '%');
  const textEl = document.getElementById('onboard-progress-text');
  if (textEl) textEl.textContent = `Step ${currentOnboardStep} of ${TOTAL_ONBOARD_STEPS}`;
}

function showOnboardStep(step) {
  currentOnboardStep = step;
  document.querySelectorAll('.onboard-step').forEach(el => {
    el.style.display = el.dataset.step === String(step) ? 'grid' : 'none';
  });
  updateOnboardProgress();
}

function updateUserStatus() {
  const userId = localStorage.getItem('userId');
  const name = localStorage.getItem('userName') || 'User';
  const display = document.getElementById('userIdDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!display) return;
  if (userId) {
    display.textContent = `Hi, ${name} (DNA Active)`;
    display.style.color = 'var(--primary)';
    if (logoutBtn) logoutBtn.style.display = 'block';
  } else {
    display.textContent = 'Not Logged In';
    display.style.color = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// --- LANDING ---
function goToLanding() {
  showPage('landing-page');
  showLoginForm(false);
}

function goToOnboarding() {
  onboardingData = { name: '', email: '', password: '', colors: [], fit: '', budget: '', occasions: [] };
  currentOnboardStep = 1;
  showPage('onboard-page');
  showOnboardStep(1);
}

// --- ONBOARDING SUBMIT (final signup) ---
async function submitSignup() {
  const payload = {
    name: onboardingData.name,
    email: onboardingData.email,
    password: onboardingData.password,
    preferences: {
      colors: Array.isArray(onboardingData.colors) ? onboardingData.colors : (onboardingData.colors || '').split(',').map(c => c.trim()).filter(Boolean),
      fit: onboardingData.fit || 'regular',
      budget: onboardingData.budget || 'medium',
      occasions: Array.isArray(onboardingData.occasions) ? onboardingData.occasions : (onboardingData.occasions || '').split(',').map(o => o.trim()).filter(Boolean)
    }
  };
  if (!payload.preferences.occasions.length) payload.preferences.occasions = ['casual'];
  if (!payload.preferences.colors.length) payload.preferences.colors = ['black'];

  try {
    const res = await fetch(`${API_BASE}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Signup failed');
    }
    const result = await res.json();
    localStorage.setItem('userId', result.userId);
    localStorage.setItem('userName', payload.name);
    updateUserStatus();
    showPage('shop-page');
    loadProducts();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// --- FAVOURITES HELPERS ---
async function fetchFavourites() {
  const userId = localStorage.getItem('userId');
  favouriteIds = new Set();
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/favourites`);
    if (!res.ok) return [];
    const favs = await res.json();
    favouriteIds = new Set(favs.map(f => f._id));
    return favs;
  } catch (err) {
    console.error('Fetch favourites failed:', err);
    return [];
  }
}

// --- API: Products ---
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to load products');
    const products = await res.json();
    allProducts = products;
    const userId = localStorage.getItem('userId');

    if (userId) {
      await fetchFavourites();
    }

    renderProducts(products, userId);
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Could not load products. Is the backend running?</p>';
  }
}

function renderProducts(products, userId) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = '<p class="empty-state">No matching products for this search.</p>';
    return;
  }

  console.log('🏪 Rendering products:', products.length, 'products');

  grid.innerHTML = products.map(p => {
    let imgSrc = FALLBACK_IMAGE;
    if (p.imageUrl) {
      imgSrc = p.imageUrl.startsWith('http')
        ? p.imageUrl
        : `${API_BASE.replace('/api', '')}${p.imageUrl}`;
    }
    const isFav = favouriteIds.has(p._id);
    const buyBtn = p.buyUrl
      ? `<a class="buy-btn" href="${p.buyUrl}" target="_blank" rel="noopener noreferrer">Buy</a>`
      : `<button type="button" class="buy-btn buy-btn-disabled" disabled title="No buy link available">Buy</button>`;
    
    console.log('📦 Rendering product:', p._id, 'isFav:', isFav);
    
    return `
        <div class="product-card" data-id="${p._id}">
          <button type="button" class="fav-toggle ${isFav ? 'fav-active' : ''}" data-id="${p._id}" title="${isFav ? 'Remove from favourites' : 'Save to favourites'}">♥</button>
          <img src="${imgSrc}" 
               alt="${p.name || 'Product'}" 
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
          <div class="product-info">
            <h3>${p.category || ''}</h3>
            <h4>${p.name || 'Item'}</h4>
            <p>₹${p.price != null ? p.price : '—'}</p>
            <div class="product-actions">
              ${userId ? `<button type="button" class="get-outfit-btn" data-id="${p._id}">Get outfit</button>` : `<button type="button" class="get-outfit-btn buy-btn-disabled" disabled title="Log in to get recommendations">Get outfit</button>`}
              ${buyBtn}
            </div>
          </div>
        </div>
      `;
  }).join('');

  console.log('🔍 Looking for fav-toggle buttons in grid...');
  const favButtons = grid.querySelectorAll('.fav-toggle');
  console.log('🎯 Found fav-toggle buttons:', favButtons.length);

  grid.querySelectorAll('.get-outfit-btn').forEach(btn => {
    btn.addEventListener('click', () => getRecommendations(btn.dataset.id));
  });
  favButtons.forEach(btn => {
    console.log('🔗 Attaching fav toggle listener to button:', btn.dataset.id);
    btn.addEventListener('click', (e) => {
      console.log('🖱️ Fav button clicked:', btn.dataset.id);
      e.preventDefault();
      e.stopPropagation();
      toggleFavourite(btn.dataset.id, btn);
    });
  });
}

// --- API: Recommendations ---
async function getRecommendations(selectedItemId) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please log in to see recommendations.');
    return;
  }

  showPage('shop-page');
  const recsEl = document.getElementById('recsDisplay');
  const outfitEl = document.getElementById('outfitDisplay');
  const section = document.getElementById('recommendations-section');
  if (!recsEl || !outfitEl || !section) return;

  console.log('[AI FLOW] getRecommendations for productId =', selectedItemId, 'userId =', userId);
  section.classList.remove('recs-hidden');
  section.style.display = 'block';

  recsEl.innerHTML = '<p class="empty-state">Loading recommendations…</p>';
  outfitEl.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/recommendations/${userId}/${selectedItemId}`);
    console.log('[AI FLOW] GET /recommendations status =', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('[AI FLOW] GET /recommendations response JSON =', data);
    if (!res.ok) {
      console.warn('[AI FLOW] /recommendations failed, using dummy recommendations instead');
      renderDummyRecommendations(selectedItemId);
      return;
    }
    const { recommendations = [], fullOutfit = {} } = data;

    const baseUrl = API_BASE.replace('/api', '');
    const makeImg = (p) => {
      if (!p || !p.imageUrl) return FALLBACK_IMAGE;
      return p.imageUrl.startsWith('http')
        ? p.imageUrl
        : baseUrl + p.imageUrl;
    };

    // Render AI-analyzed item card when coming from AI image flow
    const aiCardEl = document.getElementById('aiAnalyzedCard');
    if (aiCardEl && lastAiAnalysis && lastAiAnalysis.productId === selectedItemId) {
      aiCardEl.style.display = 'block';
      aiCardEl.innerHTML = renderAiAnalyzedCard(lastAiAnalysis, baseUrl);
      lastAiAnalysis = null;
    } else if (aiCardEl) {
      aiCardEl.style.display = 'none';
      aiCardEl.innerHTML = '';
    }

    recsEl.innerHTML = recommendations.length
      ? recommendations.slice(0, 6).map(r => {
        const buyPart = r.buyUrl
          ? `<a class="buy-btn rec-buy-btn" href="${r.buyUrl}" target="_blank" rel="noopener noreferrer">Buy</a>`
          : '';
        return `
          <div class="rec-card">
            <img src="${makeImg(r)}" 
                 alt="${r.name}" 
                 loading="lazy" 
                 referrerpolicy="no-referrer-when-downgrade"
                 onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" 
                 style="width:100%;height:220px;object-fit:cover;border-radius:10px;margin-bottom:10px;">
            <strong>${r.name || r.category}</strong>
            <p style="margin:4px 0 8px;font-size:13px;color:var(--text-light);">₹${r.price != null ? r.price : '—'}</p>
            ${buyPart}
          </div>`;
      }).join('')
      : '<p class="empty-state">No matching recommendations for this item.</p>';

    const parts = [];
    if (fullOutfit.upper) parts.push(`Top: ${fullOutfit.upper.name || fullOutfit.upper.category}`);
    if (fullOutfit.lower) parts.push(`Bottom: ${fullOutfit.lower.name || fullOutfit.lower.category}`);
    if (fullOutfit.footwear) parts.push(`Footwear: ${fullOutfit.footwear.name || fullOutfit.footwear.category}`);
    if (data.cluster) parts.push(`Style: ${data.cluster}`);
    outfitEl.innerHTML = parts.length ? '<p>' + parts.join(' · ') + '</p>' : '';
    if (section && section.scrollIntoView) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('[AI FLOW] getRecommendations error, using dummy recommendations instead:', err);
    renderDummyRecommendations(selectedItemId);
  }
}

function renderDummyRecommendations(selectedItemId) {
  const recsEl = document.getElementById('recsDisplay');
  const outfitEl = document.getElementById('outfitDisplay');
  const section = document.getElementById('recommendations-section');
  if (!recsEl || !outfitEl || !section) return;

  section.classList.remove('recs-hidden');
  section.style.display = 'block';

  const baseUrl = API_BASE.replace('/api', '');
  const makeImg = (p) => {
    if (!p || !p.imageUrl) return FALLBACK_IMAGE;
    return p.imageUrl.startsWith('http') ? p.imageUrl : baseUrl + p.imageUrl;
  };

  // If backend products are not available, use a small hard-coded demo set
  let sourceProducts = allProducts && allProducts.length ? allProducts.slice() : [
    {
      name: 'Demo Black Kurti',
      category: 'kurti',
      gender: 'women',
      price: 599,
      color: 'black',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Demo Palazzo Pants',
      category: 'palazzo',
      gender: 'women',
      price: 799,
      color: 'cream',
      imageUrl: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Demo Heels',
      category: 'heels',
      gender: 'women',
      price: 1299,
      color: 'gold',
      imageUrl: 'https://images.unsplash.com/photo-1528701800489-20be3c30c1d5?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const selected = sourceProducts.find(p => p._id === selectedItemId);
  let pool = sourceProducts.slice();

  if (selected) {
    pool = pool.filter(p => {
      if (!p || !p._id || p._id === selected._id) return false;
      const sameGender = !selected.gender || p.gender === selected.gender || p.gender === 'unisex';
      const colorMatch =
        !selected.color ||
        p.color === selected.color ||
        (Array.isArray(p.compatibleColors) && p.compatibleColors.includes(selected.color));
      return sameGender && colorMatch;
    });
  }

  if (!pool.length) {
    pool = sourceProducts.slice();
  }

  const picks = pool.slice(0, 6);

  recsEl.innerHTML = picks.length
    ? picks.map(r => {
      const buyPart = r.buyUrl
        ? `<a class="buy-btn rec-buy-btn" href="${r.buyUrl}" target="_blank" rel="noopener noreferrer">Buy</a>`
        : '';
      return `
        <div class="rec-card">
          <img src="${makeImg(r)}"
               alt="${r.name || r.category || 'Recommended item'}"
               loading="lazy"
               referrerpolicy="no-referrer-when-downgrade"
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
               style="width:100%;height:220px;object-fit:cover;border-radius:10px;margin-bottom:10px;">
          <strong>${r.name || r.category}</strong>
          <p style="margin:4px 0 8px;font-size:13px;color:var(--text-light);">₹${r.price != null ? r.price : '—'}</p>
          ${buyPart}
        </div>`;
    }).join('')
    : '<p class="empty-state">No recommendations available right now. Please try again later.</p>';

  const label = selected ? (selected.name || selected.category || 'item') : 'your item';
  outfitEl.innerHTML = `<p>Showing smart dummy outfit suggestions based on ${label}.</p>`;
}

// --- API: Upload ---
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById('uploadResult');
  const photoInput = document.getElementById('photo');
  if (!photoInput?.files?.length) {
    if (resultEl) { resultEl.className = 'message-box error'; resultEl.textContent = 'Please choose a photo.'; }
    return;
  }

  const formData = new FormData();
  formData.append('photo', photoInput.files[0]);
  formData.append('name', document.getElementById('item-name').value);
  formData.append('category', document.getElementById('item-category').value);
  formData.append('color', document.getElementById('item-color').value || '');
  formData.append('fit', document.getElementById('item-fit').value || '');
  formData.append('price', document.getElementById('item-price').value);
  const occasionVal = document.getElementById('item-occasion').value;
  formData.append('occasion', occasionVal ? occasionVal.split(',').map(o => o.trim()).join(',') : 'casual');
  formData.append('compatibleColors', document.getElementById('item-compatibleColors').value || '');
  formData.append('compatibleTypes', document.getElementById('item-compatibleTypes').value || '');
  formData.append('trendScore', document.getElementById('item-trendScore').value || '5');
  formData.append('isTrending', document.getElementById('item-isTrending').value || 'false');

  try {
    const res = await fetch(`${API_BASE}/products/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      resultEl.className = 'message-box error';
      resultEl.textContent = data.error || 'Upload failed';
      return;
    }
    resultEl.className = 'message-box success';
    resultEl.textContent = 'Item uploaded! You can see it in Shop Outfits.';
    e.target.reset();
  } catch (err) {
    resultEl.className = 'message-box error';
    resultEl.textContent = 'Network error. Is the backend running?';
  }
});

// --- AI: Image → Attributes → Product → Recommendations ---
async function fetchWithTimeout(url, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

function setUploadStatus(resultEl, kind, text) {
  if (!resultEl) return;
  resultEl.className = `message-box ${kind || ''}`.trim();
  resultEl.textContent = text;
}

async function analyzeImageAndRecommend() {
  console.log('[AI FLOW] analyzeImageAndRecommend clicked');
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please log in and create your Style DNA first.');
    return;
  }

  const photoInput = document.getElementById('photo');
  const resultEl = document.getElementById('uploadResult');
  if (!photoInput?.files?.length) {
    if (resultEl) { resultEl.className = 'message-box error'; resultEl.textContent = 'Please choose a photo first.'; }
    return;
  }

  try {
    setUploadStatus(resultEl, '', 'Step 1/3: Uploading image to AI…');
    const miniText = document.querySelector('#aiMiniStatus .ai-status-text');
    if (miniText) miniText.textContent = 'Uploading to AI…';
    if (resultEl && resultEl.scrollIntoView) {
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const formData = new FormData();
    formData.append('image', photoInput.files[0]);

    let aiRes;
    let aiEndpointUsed = `${AI_API_BASE}/api/ai/analyze`;

    try {
      // Single call to Node backend; Node will forward to Python AI service.
      aiRes = await fetchWithTimeout(
        aiEndpointUsed,
        { method: 'POST', body: formData },
        60000 // 60s timeout so it never hangs forever on Step 1
      );
    } catch (e) {
      const msg = e?.name === 'AbortError'
        ? 'AI request timed out. Try a smaller image or retry.'
        : 'Could not reach AI service. Ensure `node backend/server.js` and `python app.py` are running.';
      throw new Error(msg);
    }

    // Read text first so we can always show a raw snippet on failure.
    const ctype = aiRes.headers?.get?.('content-type') || '';
    const aiText = await aiRes.text().catch(() => '');
    const rawSnippet = (aiText || '').slice(0, 500);
    let aiData = {};
    try {
      aiData = aiText ? JSON.parse(aiText) : {};
    } catch {
      aiData = { error: 'AI returned non-JSON response', raw: rawSnippet };
    }

    if (!aiRes.ok || aiData.error) {
      const errMsg = aiData?.error || `AI analysis failed (HTTP ${aiRes.status})`;
      const details = rawSnippet
        ? ` | endpoint: ${aiEndpointUsed} | status: ${aiRes.status} | content-type: ${ctype || 'unknown'} | raw: ${rawSnippet}`
        : (aiData?.raw ? ` | raw: ${aiData.raw}` : '');
      throw new Error(errMsg + details);
    }

    setUploadStatus(resultEl, '', 'AI analyzed. Loading recommendations…');
    if (miniText) miniText.textContent = 'Generating outfit recommendations…';

    const productId = aiData.productId || aiData.product?._id || null;

    lastAiAnalysis = {
      product: aiData.product || aiData,
      aiAttributes: aiData.aiAttributes || aiData,
      productId
    };

    // Always show the AI analysis card, even if we cannot save a product.
    setUploadStatus(resultEl, 'success', productId
      ? 'Loading your personalized recommendations…'
      : 'AI analyzed your item. Showing details (recommendations may be limited)…');

    // Navigate immediately so the user sees progress on the Shop page.
    showPage('shop-page');

    const section = document.getElementById('recommendations-section');
    const aiCardEl = document.getElementById('aiAnalyzedCard');
    const recsEl = document.getElementById('recsDisplay');
    const outfitEl = document.getElementById('outfitDisplay');
    const baseUrl = API_BASE.replace('/api', '');

    if (section) {
      section.classList.remove('recs-hidden');
      section.style.display = 'block';
    }
    if (aiCardEl && lastAiAnalysis) {
      aiCardEl.style.display = 'block';
      aiCardEl.innerHTML = renderAiAnalyzedCard(lastAiAnalysis, baseUrl);
    }

    if (!productId) {
      // We have AI JSON but could not create a DB product; show a friendly message instead of failing.
      if (recsEl) {
        recsEl.innerHTML = '<p class=\"empty-state\">AI understood your item but could not save it for outfit recommendations. You can still browse and click \"Get outfit\" on any product below.</p>';
      }
      if (outfitEl) {
        outfitEl.innerHTML = '';
      }
      return;
    }

    await getRecommendations(productId);
  } catch (err) {
    console.error('[AI FLOW] analyzeImageAndRecommend failed, falling back to manual upload:', err);
    lastAiAnalysis = null;
    const miniText = document.querySelector('#aiMiniStatus .ai-status-text');
    if (miniText) miniText.textContent = 'AI could not read the photo. Using your item details instead…';

    // Fallback: create a product using the same form fields as manual upload,
    // then show recommendations from that product.
    try {
      if (!photoInput?.files?.length) {
        throw new Error('No photo available for fallback.');
      }

      setUploadStatus(resultEl, '', 'AI failed. Creating outfit from your item details…');

      const fd = new FormData();
      fd.append('photo', photoInput.files[0]);
      fd.append('name', document.getElementById('item-name').value || 'My Outfit Item');
      fd.append('category', document.getElementById('item-category').value || 'shirt');
      fd.append('color', document.getElementById('item-color').value || '');
      fd.append('fit', document.getElementById('item-fit').value || '');
      fd.append('price', document.getElementById('item-price').value || '1499');
      const occasionVal = document.getElementById('item-occasion').value;
      fd.append('occasion', occasionVal ? occasionVal.split(',').map(o => o.trim()).join(',') : 'casual');
      fd.append('compatibleColors', document.getElementById('item-compatibleColors').value || '');
      fd.append('compatibleTypes', document.getElementById('item-compatibleTypes').value || '');
      fd.append('trendScore', document.getElementById('item-trendScore').value || '7');
      fd.append('isTrending', document.getElementById('item-isTrending').value || 'true');

      const resp = await fetch(`${API_BASE}/products/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.productId) {
        throw new Error(data.error || 'Fallback product upload failed');
      }

      setUploadStatus(resultEl, 'success', 'Showing outfit recommendations based on your item details.');
      showPage('shop-page');
      await getRecommendations(data.productId);
    } catch (fallbackErr) {
      console.error('[AI FLOW] Fallback upload failed:', fallbackErr);
      setUploadStatus(resultEl, 'error', `AI & fallback failed: ${fallbackErr.message}`);
    }
  }
}

function renderAiAnalyzedCard(aiData, baseUrl) {
  const { product, aiAttributes } = aiData;
  const attrs = aiAttributes || product || {};
  const imgSrc = product?.imageUrl
    ? (product.imageUrl.startsWith('http') ? product.imageUrl : baseUrl + product.imageUrl)
    : FALLBACK_IMAGE;

  const label = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const val = (v) => (v && v !== 'unknown' && v !== 'none' ? String(v) : '—');

  const rows = [
    ['type', attrs.type],
    ['category', attrs.category],
    ['gender', attrs.gender],
    ['dominant_color', attrs.dominant_color],
    ['secondary_color', attrs.secondary_color],
    ['fit', attrs.fit],
    ['pattern', attrs.pattern],
    ['sleeve_length', attrs.sleeve_length],
    ['style_category', attrs.style_category],
    ['occasion_guess', attrs.occasion_guess]
  ].filter(([, v]) => v && v !== 'unknown' && v !== 'none');

  return `
    <div class="ai-analyzed-inner">
      <div class="ai-analyzed-image">
        <img src="${imgSrc}" alt="Your item" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
             onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
      </div>
      <div class="ai-analyzed-details">
        <h3 class="ai-analyzed-title"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Analyzed Your Item</h3>
        <p class="ai-analyzed-subtitle">Gemini identified these attributes from your photo:</p>
        <dl class="ai-attributes-grid">
          ${rows.map(([k, v]) => `
            <div class="ai-attr-row">
              <dt>${label(k)}</dt>
              <dd>${val(v)}</dd>
            </div>
          `).join('')}
        </dl>
      </div>
    </div>
  `;
}

function mapAiResultToProduct(ai) {
  const categoryGroup = (ai.category || 'upper').toLowerCase();

  // IMPORTANT: backend compatibility rules use `category` (e.g., kurti/jeans/heels).
  // So prefer ai.type when it's a known product type.
  const knownTypes = new Set([
    'shirt', 'tshirt', 'top', 'crop_top', 'kurti', 'blouse', 'polo',
    'pant', 'jeans', 'trouser', 'chinos', 'cargo_pant', 'jogger', 'palazzo', 'skirt', 'legging', 'shorts',
    'blazer', 'jacket', 'hoodie', 'coat',
    'dress', 'gown', 'jumpsuit', 'saree', 'lehenga', 'suit',
    'heels', 'boots', 'sneakers', 'formal_shoes', 'loafers', 'flats', 'belly',
    'belt', 'clutch', 'dupatta', 'jewelry', 'bag'
  ]);

  let type = (ai.type || '').toString().trim().toLowerCase();
  if (!knownTypes.has(type)) {
    // Fall back based on category group if AI returns an unknown type
    if (categoryGroup === 'lower') type = 'pant';
    else if (categoryGroup === 'footwear') type = 'heels';
    else if (categoryGroup === 'accessory') type = 'bag';
    else type = 'shirt';
  }

  // Map category group to match backend field expectations (`categoryGroup`).
  const mappedGroup = (categoryGroup === 'upper' || categoryGroup === 'lower' || categoryGroup === 'footwear' || categoryGroup === 'accessory')
    ? categoryGroup
    : 'upper';

  const occasion = ai.occasion_guess ? [ai.occasion_guess] : ['casual'];

  return {
    name: (ai.type || 'AI Outfit Item').toString(),
    gender: ai.gender && ['men', 'women', 'unisex'].includes(ai.gender) ? ai.gender : 'unisex',
    category: type,
    categoryGroup: mappedGroup,
    color: (ai.dominant_color || '').toString().toLowerCase(),
    fit: ai.fit && ai.fit !== 'unknown' ? ai.fit : '',
    pattern: ai.pattern && ai.pattern !== 'unknown' ? ai.pattern : '',
    sleeveLength: ai.sleeve_length && ai.sleeve_length !== 'unknown' ? ai.sleeve_length : '',
    styleCategory: (ai.style_category || '').toString().toLowerCase(),
    occasion,
    price: 1500,
    trendScore: 7,
    isTrending: true,
    compatibleColors: [],
    compatibleTypes: [],
    season: 'all'
  };
}

// --- LOGIN ---
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button');
  const origText = btn.textContent;
  btn.textContent = 'Logging in…';
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name || 'User');
    updateUserStatus();
    showPage('home-page');
  } catch (err) {
    alert(err.message);
  }
  btn.textContent = origText;
});

// --- LOGOUT ---
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  updateUserStatus();
  goToLanding();
});

// --- NAV LINKS ---
document.getElementById('home-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (localStorage.getItem('userId')) showPage('home-page');
  else goToLanding();
});

document.getElementById('shop-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (localStorage.getItem('userId')) showPage('shop-page');
  else { goToLanding(); showLoginForm(true); }
});

document.getElementById('favourites-link')?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!localStorage.getItem('userId')) {
    goToLanding();
    showLoginForm(true);
    return;
  }
  showPage('favourites-page');
  await loadFavouritesPage();
});

// --- LANDING CTAs ---
document.getElementById('landing-signup-btn')?.addEventListener('click', goToOnboarding);
document.getElementById('landing-login-btn')?.addEventListener('click', () => { showLoginForm(true); });
document.getElementById('switch-to-signup')?.addEventListener('click', goToOnboarding);

// AI image button
document.getElementById('ai-image-btn')?.addEventListener('click', analyzeImageAndRecommend);

// Product search
document.getElementById('product-search')?.addEventListener('input', applyProductFilters);
document.getElementById('filter-gender')?.addEventListener('change', applyProductFilters);
document.getElementById('filter-color')?.addEventListener('change', applyProductFilters);
document.getElementById('filter-occasion')?.addEventListener('change', applyProductFilters);
document.getElementById('filter-price')?.addEventListener('change', applyProductFilters);

function applyProductFilters() {
  const userId = localStorage.getItem('userId');
  const termInput = document.getElementById('product-search');
  const genderSelect = document.getElementById('filter-gender');
  const colorSelect = document.getElementById('filter-color');
  const occasionSelect = document.getElementById('filter-occasion');
  const priceSelect = document.getElementById('filter-price');
  const trendingCheckbox = document.getElementById('filter-trending');
  const sortSelect = document.getElementById('sort-products');
  const filtersMeta = document.getElementById('filters-meta');

  const term = termInput?.value.trim().toLowerCase() || '';
  const gender = genderSelect?.value || '';
  const color = colorSelect?.value || '';
  const occasion = occasionSelect?.value || '';
  const priceRange = priceSelect?.value || '';
  const trendingOnly = !!(trendingCheckbox && trendingCheckbox.checked);

  let filtered = allProducts.slice();

  if (gender) {
    filtered = filtered.filter(p => (p.gender || 'unisex') === gender);
  }

  if (color) {
    filtered = filtered.filter(p => p.color && p.color.toLowerCase() === color);
  }

  if (occasion) {
    filtered = filtered.filter(p =>
      Array.isArray(p.occasion) &&
      p.occasion.some(o => o.toLowerCase() === occasion)
    );
  }

  if (priceRange) {
    filtered = filtered.filter(p => {
      const price = Number(p.price) || 0;
      if (priceRange === 'lt500') return price < 500;
      if (priceRange === '500-1000') return price >= 500 && price <= 1000;
      if (priceRange === '1000-2000') return price > 1000 && price <= 2000;
      if (priceRange === 'gt2000') return price > 2000;
      return true;
    });
  }

  if (trendingOnly) {
    filtered = filtered.filter(p => p.isTrending === true || p.trendScore >= 7);
  }

  if (term) {
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term))
    );
  }

  if (sortSelect && sortSelect.value) {
    const sortVal = sortSelect.value;
    filtered = filtered.slice().sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (sortVal === 'price-asc') return priceA - priceB;
      if (sortVal === 'price-desc') return priceB - priceA;
      if (sortVal === 'newest') {
        const idA = (a._id || '').toString();
        const idB = (b._id || '').toString();
        return idA < idB ? 1 : -1;
      }
      return 0;
    });
  }

  if (filtersMeta) {
    const total = allProducts.length;
    const count = filtered.length;
    filtersMeta.textContent = count === total
      ? 'Showing all items'
      : `Showing ${count} of ${total}`;
  }

  renderProducts(filtered, userId);
}

// --- DEBUG: Test fav buttons manually ---
window.testFavButtons = function() {
    console.log('🧪 Testing fav buttons manually...');
    const buttons = document.querySelectorAll('.fav-toggle');
    console.log('Found buttons:', buttons.length);
    
    buttons.forEach((btn, index) => {
        console.log(`Button ${index}:`, {
            id: btn.dataset.id,
            classes: btn.className,
            visible: btn.offsetParent !== null,
            clickable: btn.style.pointerEvents !== 'none',
            zindex: window.getComputedStyle(btn).zIndex
        });
        
        // Add a visual test click
        btn.style.border = '2px solid red';
        setTimeout(() => {
            btn.style.border = '';
        }, 2000);
    });
};

// --- FAVOURITES TOGGLE (FINAL FIXED VERSION) ---
async function toggleFavourite(productId, buttonEl, fromFavouritesPage = false) {
  console.log('🔄 toggleFavourite called:', { productId, fromFavouritesPage, buttonEl });
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please log in to save favourites.');
    goToLanding();
    showLoginForm(true);
    return;
  }

  if (!buttonEl) {
    console.error('❌ No button element provided to toggleFavourite');
    return;
  }

  const isCurrentlyActive = buttonEl.classList.contains('fav-active');
  console.log('📝 Current state:', { isCurrentlyActive, classes: buttonEl.className });

  try {
    let response;
    if (isCurrentlyActive) {
      response = await fetch(`${API_BASE}/users/${userId}/favourites/${productId}`, { method: 'DELETE' });
    } else {
      response = await fetch(`${API_BASE}/users/${userId}/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to ${isCurrentlyActive ? 'remove' : 'add'}`);
    }

    const result = await response.json();
    console.log('✅ Backend response:', result);

    // Sync with backend response
    favouriteIds = new Set(result.favourites ? result.favourites.map(f => f._id) : []);

    // Update heart UI
    if (isCurrentlyActive) {
      buttonEl.classList.remove('fav-active');
      buttonEl.title = 'Save to favourites';
      console.log(`🗑️ Removed from favourites: ${productId}`);
    } else {
      buttonEl.classList.add('fav-active');
      buttonEl.title = 'Remove from favourites';
      console.log(`❤️ Added to favourites: ${productId}`);
    }

    console.log('🎨 Updated button classes:', buttonEl.className);

    // Refresh current view
    if (fromFavouritesPage) {
      await loadFavouritesPage();
    } else {
      await loadProducts();   // refresh all hearts on shop page
    }

  } catch (err) {
    console.error('❌ Favourite toggle failed:', err);
    alert('Failed to update favourite: ' + err.message);
  }
}

// --- LOAD FAVOURITES PAGE (FINAL FIXED VERSION) ---
async function loadFavouritesPage() {
  const grid = document.getElementById('favouritesGrid');
  if (!grid) {
    console.error("❌ Element with id 'favouritesGrid' not found in HTML!");
    return;
  }

  const userId = localStorage.getItem('userId');
  if (!userId) {
    grid.innerHTML = '<p class="empty-state">Please log in to view favourites.</p>';
    return;
  }

  try {
    console.log(`🔄 Loading favourites for user: ${userId}`);
    const favs = await fetchFavourites();

    console.log(`✅ Backend returned ${favs.length} favourite items`);

    if (!favs || favs.length === 0) {
      grid.innerHTML = `<p class="empty-state">No favourites yet.<br>Click ♥ on any product in Shop to save them ❤️</p>`;
      return;
    }

    grid.innerHTML = favs.map(p => {
      let imgSrc = FALLBACK_IMAGE;
      if (p.imageUrl) {
        imgSrc = p.imageUrl.startsWith('http')
          ? p.imageUrl
          : `${API_BASE.replace('/api', '')}${p.imageUrl}`;
      }
      const buyBtn = p.buyUrl
        ? `<a class="buy-btn" href="${p.buyUrl}" target="_blank" rel="noopener noreferrer">Buy</a>`
        : `<button type="button" class="buy-btn buy-btn-disabled" disabled title="No buy link available">Buy</button>`;

      return `
        <div class="product-card" data-id="${p._id}">
          <button type="button" class="fav-toggle fav-active" data-id="${p._id}" title="Remove from favourites">♥</button>
          <img src="${imgSrc}" 
               alt="${p.name || 'Product'}" 
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
          <div class="product-info">
            <h3>${p.category || ''}</h3>
            <h4>${p.name || 'Item'}</h4>
            <p>₹${p.price != null ? p.price : '—'}</p>
            <div class="product-actions">
              <button type="button" class="get-outfit-btn" data-id="${p._id}">Get outfit</button>
              ${buyBtn}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach listeners
    grid.querySelectorAll('.get-outfit-btn').forEach(btn => {
      btn.addEventListener('click', () => getRecommendations(btn.dataset.id));
    });
    grid.querySelectorAll('.fav-toggle').forEach(btn => {
      console.log('🔗 Attaching fav toggle listener to favourites page button:', btn.dataset.id);
      btn.addEventListener('click', () => {
        console.log('🖱️ Favourites page fav button clicked:', btn.dataset.id);
        toggleFavourite(btn.dataset.id, btn, true);
      });
    });

  } catch (err) {
    console.error('❌ Load favourites error:', err);
    grid.innerHTML = '<p class="empty-state">Could not load favourites. Check console (F12).</p>';
  }
}

// --- ONBOARDING STEPS ---
document.getElementById('onboardAccountForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  onboardingData.name = document.getElementById('onboard-name').value;
  onboardingData.email = document.getElementById('onboard-email').value;
  onboardingData.password = document.getElementById('onboard-password').value;
  showOnboardStep(2);
});

document.getElementById('onboard-back-2')?.addEventListener('click', () => showOnboardStep(1));
document.getElementById('onboardColorsForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  onboardingData.colors = document.getElementById('onboard-colors').value.split(',').map(c => c.trim()).filter(Boolean);
  showOnboardStep(3);
});

document.getElementById('onboard-back-3')?.addEventListener('click', () => showOnboardStep(2));
document.getElementById('onboardFitForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  onboardingData.fit = document.getElementById('onboard-fit').value;
  showOnboardStep(4);
});

document.getElementById('onboard-back-4')?.addEventListener('click', () => showOnboardStep(3));
document.getElementById('onboardBudgetForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  onboardingData.budget = document.getElementById('onboard-budget').value;
  showOnboardStep(5);
});

document.getElementById('onboard-back-5')?.addEventListener('click', () => showOnboardStep(4));
document.getElementById('onboardOccasionsForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  onboardingData.occasions = document.getElementById('onboard-occasions').value.split(',').map(o => o.trim()).filter(Boolean);
  submitSignup();
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  updateUserStatus();
  const userId = localStorage.getItem('userId');
  if (userId) {
    showPage('home-page');
  } else {
    showPage('landing-page');
  }

  // Nav active state + mobile toggle
  const navLinks = document.querySelectorAll('.nav-links a');
  function setActiveNav(pageId) {
    navLinks.forEach(link => {
      link.classList.remove('nav-active');
    });
    if (pageId === 'home-page') {
      document.getElementById('home-link')?.classList.add('nav-active');
    } else if (pageId === 'shop-page') {
      document.getElementById('shop-link')?.classList.add('nav-active');
    } else if (pageId === 'favourites-page') {
      document.getElementById('favourites-link')?.classList.add('nav-active');
    }
  }
  setActiveNav(userId ? 'home-page' : 'landing-page');

  const navToggle = document.getElementById('nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-mobile-open');
    });
  }

  // Style quiz button (dummy) just scrolls to shop / onboarding
  document.getElementById('style-quiz-btn')?.addEventListener('click', () => {
    if (localStorage.getItem('userId')) {
      showPage('shop-page');
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      goToOnboarding();
    }
  });

  // Upload preview
  const photoInput = document.getElementById('photo');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('uploadPreviewImg');
  const previewCaption = document.getElementById('uploadPreviewCaption');
  const aiMiniStatus = document.getElementById('aiMiniStatus');
  const aiMiniText = aiMiniStatus?.querySelector('.ai-status-text');
  const aiDropZone = document.getElementById('aiDropZone');
  if (photoInput && preview && previewImg) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      if (!file) {
        preview.style.display = 'none';
        if (aiMiniText) aiMiniText.textContent = 'Ready. Add a photo to start.';
        return;
      }
      const url = URL.createObjectURL(file);
      previewImg.src = url;
      if (previewCaption) {
        const sizeMb = Math.max(0.1, (file.size / (1024 * 1024))).toFixed(1);
        previewCaption.textContent = `${file.name} · ${sizeMb}MB`;
      }
      preview.style.display = 'block';
      if (aiMiniText) aiMiniText.textContent = 'Photo received. Add details or run AI Outfit from Photo.';
    });
  }

  // Upload dropzone interactivity (visual only; browsers restrict setting input files)
  if (aiDropZone && photoInput) {
    // Make entire card clickable to open file picker
    aiDropZone.addEventListener('click', (e) => {
      // If user directly clicks the invisible input, let the browser handle it
      if (e.target === photoInput) return;
      photoInput.click();
    });

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ['dragenter', 'dragover'].forEach(evt => {
      aiDropZone.addEventListener(evt, (e) => {
        prevent(e);
        aiDropZone.classList.add('dragover');
        if (aiMiniText) aiMiniText.textContent = 'Drop detected. Release to continue (or click to browse).';
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      aiDropZone.addEventListener(evt, (e) => {
        prevent(e);
        aiDropZone.classList.remove('dragover');
        if (evt === 'drop') {
          // We can’t reliably attach dropped files to <input type="file"> programmatically.
          if (aiMiniText) aiMiniText.textContent = 'For security reasons, please click to browse and select the file.';
          showComingSoonToast('Tip: Click the upload card to choose a file');
        }
      });
    });
  }

  // Advanced upload section toggle
  const uploadAdvancedToggle = document.getElementById('upload-advanced-toggle');
  const uploadAdvanced = document.getElementById('upload-advanced');
  const uploadChevron = uploadAdvancedToggle?.querySelector('.upload-advanced-chevron');
  if (uploadAdvancedToggle && uploadAdvanced) {
    uploadAdvancedToggle.addEventListener('click', () => {
      const isOpen = uploadAdvanced.classList.toggle('open');
      if (uploadChevron) {
        uploadChevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // Filter chips shortcuts
  const chipNew = document.getElementById('chip-new');
  const chipTrending = document.getElementById('chip-trending');
  const chipBudget = document.getElementById('chip-budget');

  function toggleChip(chipEl, cb) {
    if (!chipEl) return;
    chipEl.addEventListener('click', () => {
      chipEl.classList.toggle('active');
      cb(chipEl.classList.contains('active'));
      applyProductFilters();
    });
  }

  toggleChip(chipBudget, (active) => {
    const priceSelect = document.getElementById('filter-price');
    if (!priceSelect) return;
    priceSelect.value = active ? 'lt500' : '';
  });

  toggleChip(chipTrending, (active) => {
    const trendingCb = document.getElementById('filter-trending');
    if (!trendingCb) return;
    trendingCb.checked = active;
  });

  toggleChip(chipNew, () => {
    // purely visual for now; keeps chip as a dummy UX element
  });

  // Clear filters
  document.getElementById('filters-clear')?.addEventListener('click', () => {
    const ids = ['filter-gender', 'filter-color', 'filter-occasion', 'filter-price', 'product-search', 'filter-trending'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
        if (el.type === 'checkbox') {
          el.checked = false;
        } else {
          el.value = '';
        }
      }
    });
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    applyProductFilters();
  });

  // Color swatch filters
  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color') || '';
      const colorSelect = document.getElementById('filter-color');
      if (colorSelect) {
        colorSelect.value = color;
      }
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      if (color) {
        swatch.classList.add('active');
      }
      applyProductFilters();
    });
  });

  // Simple "coming soon" toast for dummy actions
  function showComingSoonToast(message) {
    let toast = document.querySelector('.app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 10) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
  });

  document.querySelectorAll('.nav-icon, .nav-secondary-chip').forEach(btn => {
    if (btn.id === 'style-quiz-btn') return;
    btn.addEventListener('click', () => {
      showComingSoonToast('This section is coming soon');
    });
  });
});

// Make sure inline onclick="analyzeImageAndRecommend()" always works.
window.analyzeImageAndRecommend = analyzeImageAndRecommend;