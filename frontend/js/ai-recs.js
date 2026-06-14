// frontend/js/ai-recs.js
// Standalone AI Lab page that talks directly to ai_lab.py (/api/analyze on port 8001)
// and then builds dummy / heuristic outfit suggestions.

const AI_LAB_API_BASE = '';

let isAiLabRunning = false;
let currentUploadedImageUrl = '';

function setAiLabStatus(text) {
  const panel = document.getElementById('aiLabStatus');
  const label = panel?.querySelector('.ai-status-text');
  if (label) label.textContent = text;
}

function showAiLabUploadView() {
  const uploadView = document.getElementById('aiLabUploadView');
  const resultsView = document.getElementById('aiLabResults');
  if (uploadView && resultsView) {
    uploadView.style.display = 'block';
    resultsView.style.display = 'none';

    // Clear out the file input to reset state
    const fileInput = document.getElementById('aiLabPhoto');
    const preview = document.getElementById('aiLabPreview');
    const metricDot = document.getElementById('aiLabMetricDot');
    const metricStatus = document.getElementById('aiLabMetricStatus');

    // Reset the verification flow states
    const confirmationAction = document.getElementById('aiLabConfirmationAction');
    const outfitSection = document.getElementById('aiLabOutfitSection');
    if (confirmationAction) confirmationAction.style.display = 'none';
    if (outfitSection) outfitSection.style.display = 'none';

    if (fileInput) fileInput.value = '';
    if (preview) preview.style.display = 'none';
    setAiLabStatus('Awaiting input...');
    if (metricDot) metricDot.classList.add('idle');
    if (metricStatus) metricStatus.textContent = 'System Ready';
    
    // Reset the uploaded image URL
    currentUploadedImageUrl = '';
  }
}

function showAiLabResultsView() {
  const uploadView = document.getElementById('aiLabUploadView');
  const resultsView = document.getElementById('aiLabResults');
  if (uploadView && resultsView) {
    uploadView.style.display = 'none';
    resultsView.style.display = 'block';
    // Add fade-in animation
    resultsView.classList.add('animate-in');
  }
}


function renderAiLabAnalyzedCard(ai, imageUrl) {
  const card = document.getElementById('aiLabAnalyzedCard');
  if (!card) {
    console.error('[AI LAB] aiLabAnalyzedCard element not found');
    return;
  }

  console.log('[AI LAB] renderAiLabAnalyzedCard called with imageUrl:', imageUrl);
  console.log('[AI LAB] currentUploadedImageUrl:', currentUploadedImageUrl);

  const baseUrl = API_BASE.replace('/api', '');
  const imgSrc = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : baseUrl + imageUrl)
    : FALLBACK_IMAGE;

  console.log('[AI LAB] Final imgSrc:', imgSrc);

  const attrs = ai || {};
  const label = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const val = (v) => (v && v !== 'unknown' && v !== 'none' ? String(v) : '—');

  const rows = [
    { key: 'type', icon: '<i class="fa-solid fa-tag"></i>' },
    { key: 'category', icon: '<i class="fa-solid fa-folder"></i>' },
    { key: 'gender', icon: '<i class="fa-solid fa-venus-mars"></i>' },
    { key: 'dominant_color', icon: '<i class="fa-solid fa-palette"></i>' },
    { key: 'fit', icon: '<i class="fa-solid fa-ruler"></i>' },
    { key: 'pattern', icon: '<i class="fa-solid fa-border-all"></i>' },
    { key: 'style_category', icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>' },
    { key: 'occasion_guess', icon: '<i class="fa-regular fa-calendar-days"></i>' }
  ].filter(item => attrs[item.key] && attrs[item.key] !== 'unknown' && attrs[item.key] !== 'none');

  card.style.display = 'block';
  card.innerHTML = `
    <div class="ai-analyzed-inner">
      <div class="ai-analyzed-image">
        <img src="${imgSrc}" alt="Analyzed style asset" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
             onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
      </div>
      <div class="ai-analyzed-details">
        <h3 class="ai-analyzed-title">Style Intelligence Profile</h3>
        <p class="ai-analyzed-subtitle">Neural analysis has successfully mapped the visual signatures of your garment.</p>
        <div class="ai-attributes-grid">
          ${rows.map((item, index) => `
            <div class="ai-attr-row" style="animation-delay: ${index * 0.1}s">
              <dt>${item.icon} ${label(item.key)}</dt>
              <dd>${val(attrs[item.key])}</dd>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderAiLabRecs(ai, recommendations = []) {
  const recsEl = document.getElementById('aiLabRecs');
  const summaryEl = document.getElementById('aiLabOutfitSummary');
  const resultsSection = document.getElementById('aiLabResults');
  const resultsMeta = document.getElementById('aiLabResultsMeta');
  if (!recsEl || !summaryEl || !resultsSection) return;

  resultsSection.classList.remove('recs-hidden');

  const sourceProducts = recommendations;

  const baseUrl = API_BASE.replace('/api', '');
  const makeImg = (p) => {
    if (!p || !p.imageUrl) return FALLBACK_IMAGE;
    return p.imageUrl.startsWith('http') ? p.imageUrl : baseUrl + p.imageUrl;
  };

  const picks = sourceProducts.slice(0, 6);

  const bestScore = picks.reduce((max, p) => {
    const s = typeof p.compatibilityScore === 'number' ? p.compatibilityScore : 0;
    return Math.max(max, s);
  }, 0);
  const bestPct = Math.round(bestScore * 100);

  recsEl.innerHTML = picks.length ? picks.map(r => {
    const buyPart = r.buyUrl
      ? `<a class="buy-btn rec-buy-btn" href="${r.buyUrl}" target="_blank" rel="noopener noreferrer">Shop now</a>`
      : '';

    const scorePercentage = Math.round((r.compatibilityScore || 0) * 100);
    let scoreClass = 'rec-score-fair';
    let scoreLabel = 'Match';
    if (scorePercentage >= 80) {
      scoreClass = 'rec-score-strong';
      scoreLabel = 'Strong match';
    } else if (scorePercentage >= 60) {
      scoreClass = 'rec-score-good';
      scoreLabel = 'Good match';
    }

    return `
      <div class="rec-card">
        <div style="position:relative;">
          <img src="${makeImg(r)}"
               alt="${r.name || r.category || 'Recommended item'}"
               loading="lazy"
               referrerpolicy="no-referrer-when-downgrade"
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
          <div class="rec-score-badge ${scoreClass}">
            <span>${scorePercentage || 0}% Match</span>
          </div>
        </div>
        <div class="rec-card-content">
          <h4 style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:var(--secondary);">${r.name || r.category}</h4>
          <div class="rec-card-meta" style="margin-bottom:12px;opacity:0.8;">
            ${(r.category || '').toUpperCase()} · ${r.color ? r.color.toUpperCase() : ''}
          </div>
          <p style="margin:0 0 15px 0;font-size:18px;font-weight:800;color:var(--primary);">₹${r.price != null ? r.price : '—'}</p>
          ${buyPart}
        </div>
      </div>
    `;
  }).join('') : `
    <div class="ai-lab-recs-empty">
      <h3 style="margin:0 0 6px 0;font-size:16px;">No matching recommendations found</h3>
      <p style="margin:0;font-size:13px;">Try a clearer product-style photo or a different item.</p>
    </div>
  `;

  const label = ai?.type || ai?.category || 'your item';
  const countText = picks.length > 0 ? `${picks.length} matching items` : 'no matches';
  const extra =
    picks.length > 0 && bestPct
      ? ` · best compatibility score ${bestPct}%`
      : '';

  summaryEl.innerHTML = `
    <p>For <strong>${label}</strong> we found <strong>${countText}</strong>${extra}.</p>
  `;

  if (resultsMeta) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    resultsMeta.textContent = picks.length
      ? `Last run at ${timeStr} · ${picks.length} results`
      : `Last run at ${timeStr} · no results`;
  }

  const bestMetric = document.getElementById('aiLabMetricBestMatch');
  if (bestMetric) {
    bestMetric.textContent = picks.length && bestPct ? `${bestPct}%` : '—';
  }
}

async function fetchAllProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to load products');
  const data = await res.json();
  // In main app loadProducts, the backend returns an array, not {products}
  return Array.isArray(data) ? data : (data.products || []);
}

// Use backend recommendation engine for AI Lab via our new endpoint
async function fetchAiLabRecommendationsFromBackend(ai) {
  const userId = localStorage.getItem('userId') || 'demo_user';

  try {
    console.log('[AI LAB] Requesting recommendations for AI analysis:', ai);

    // Call our new recommendation endpoint directly
    const res = await fetch(`${API_BASE}/ai/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aiAnalysis: ai,
        userId: userId
      })
    });

    console.log('[AI LAB] POST /ai/recommendations status =', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('[AI LAB] POST /ai/recommendations response JSON =', data);

    if (!res.ok) {
      console.warn('[AI LAB] /ai/recommendations failed:', data);
      return [];
    }

    // Filter recommendations to show only complementary items (not same category)
    const recs = (data.recommendations || []).filter(p => {
      if (!p) return false;
      const group = (p.categoryGroup || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();

      // Don't show items from the same category group as the AI item
      const aiGroup = (ai.category || '').toLowerCase();
      if (group === aiGroup) return false;

      // Smart filtering based on AI item category:
      if (aiGroup === 'upper') {
        // For upper wear (kurti, shirt, etc.) - show lower and footwear
        if (group === 'lower' || group === 'footwear') return true;
        const lowerLikeCats = ['palazzo', 'legging', 'pant', 'trouser', 'trousers', 'jeans', 'skirt'];
        const footwearLikeCats = ['heels', 'boots', 'sneakers', 'flats', 'loafers', 'formal_shoes'];
        if (lowerLikeCats.includes(cat) || footwearLikeCats.includes(cat)) return true;
      } else if (aiGroup === 'lower') {
        // For lower wear (jeans, trousers, etc.) - show upper and footwear
        if (group === 'upper' || group === 'footwear') return true;
        const upperLikeCats = ['shirt', 'tshirt', 'top', 'kurti', 'blouse', 'polo', 'hoodie', 'jacket', 'blazer'];
        const footwearLikeCats = ['heels', 'boots', 'sneakers', 'flats', 'loafers', 'formal_shoes'];
        if (upperLikeCats.includes(cat) || footwearLikeCats.includes(cat)) return true;
      } else if (aiGroup === 'footwear') {
        // For footwear - show upper and lower
        if (group === 'upper' || group === 'lower') return true;
        const upperLikeCats = ['shirt', 'tshirt', 'top', 'kurti', 'blouse', 'polo', 'hoodie', 'jacket', 'blazer'];
        const lowerLikeCats = ['palazzo', 'legging', 'pant', 'trouser', 'trousers', 'jeans', 'skirt'];
        if (upperLikeCats.includes(cat) || lowerLikeCats.includes(cat)) return true;
      }

      return false;
    });

    console.log('[AI LAB] Filtered recommendations:', recs.length, 'out of', data.recommendations?.length || 0);
    return recs;

  } catch (error) {
    console.error('[AI LAB] Error fetching recommendations:', error);
    return [];
  }
}

async function runAiLab() {
  if (isAiLabRunning) return;
  isAiLabRunning = true;

  const fileInput = document.getElementById('aiLabPhoto');
  const statusEl = document.getElementById('aiLabStatus');
  const debugEl = document.getElementById('aiLabRawResponse');
  const metricDot = document.getElementById('aiLabMetricDot');
  const metricStatus = document.getElementById('aiLabMetricStatus');
  const metricLastRun = document.getElementById('aiLabMetricLastRun');
  const previewImg = document.getElementById('aiLabPreviewImg');
  if (!fileInput?.files?.length) {
    setAiLabStatus('Please choose a photo first.');
    isAiLabRunning = false;
    return;
  }

  // Get the uploaded image URL for later use
  const uploadedImageUrl = previewImg?.src || '';
  currentUploadedImageUrl = uploadedImageUrl; // Store globally

  try {
    setAiLabStatus('Neural processing initiated...');
    statusEl?.classList.add('ai-lab-status-panel', 'loading');
    if (metricDot) metricDot.classList.remove('idle');
    if (metricStatus) metricStatus.textContent = 'Analyzing garment signatures';

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    const res = await fetch(`${AI_LAB_API_BASE}/api/ai/analyze/lab`, {
      method: 'POST',
      body: formData
    });

    // Simulate real-time perception
    await new Promise(r => setTimeout(r, 800));
    setAiLabStatus('Mapping textile patterns and tones...');
    if (metricStatus) metricStatus.textContent = 'Extracting tonal palette';
    await new Promise(r => setTimeout(r, 600));

    const text = await res.text().catch(() => '');

    // Always show the raw API response for debugging / lab visibility.
    if (debugEl) {
      debugEl.textContent = text || '(empty response)';
    }

    let ai = {};
    try {
      ai = text ? JSON.parse(text) : {};
      console.log('[AI LAB] Parsed AI response:', ai);
    } catch {
      ai = { error: 'AI returned non-JSON response', raw: text.slice(0, 400) };
      console.error('[AI LAB] Failed to parse AI response:', text);
    }

    if (!res.ok || ai.error) {
      setAiLabStatus('Gemini could not process this image. No outfits generated.');
      renderAiLabAnalyzedCard(ai, currentUploadedImageUrl);
      renderAiLabRecs({}, []);
      isAiLabRunning = false;
      return;
    }

    setAiLabStatus('Garment signatures successfully mapped. Awaiting confirmation.');
    if (metricStatus) metricStatus.textContent = 'Awaiting user verification';
    renderAiLabAnalyzedCard(ai, currentUploadedImageUrl);

    // Switch to results view smoothly to show the verification step
    showAiLabResultsView();

    // Show the confirmation box
    const confirmationAction = document.getElementById('aiLabConfirmationAction');
    if (confirmationAction) confirmationAction.style.display = 'block';

    // Store the parsed ai data on the window so the confirm button can use it
    window.currentAiAnalysis = ai;

  } catch (err) {
    console.error('[AI LAB] Error:', err);
    setAiLabStatus('AI Lab error. No outfits generated for this run.');
    renderAiLabAnalyzedCard({}, currentUploadedImageUrl);
    renderAiLabRecs({}, []);
  } finally {
    isAiLabRunning = false;
    if (statusEl) statusEl.classList.remove('loading');
    if (metricDot) metricDot.classList.add('idle');
  }
}

async function proceedToRecommendations() {
  const ai = window.currentAiAnalysis;
  if (!ai) return;

  const confirmationAction = document.getElementById('aiLabConfirmationAction');
  const outfitSection = document.getElementById('aiLabOutfitSection');
  const loadingState = document.getElementById('aiLabLoadingState');
  const recsGrid = document.getElementById('aiLabRecs');
  const metricStatus = document.getElementById('aiLabMetricStatus');
  const metricLastRun = document.getElementById('aiLabMetricLastRun');

  // Hide the confirmation prompt and show the outfit section with loading spinner
  if (confirmationAction) confirmationAction.style.display = 'none';
  if (outfitSection) outfitSection.style.display = 'block';
  if (loadingState) loadingState.style.display = 'flex';
  if (recsGrid) recsGrid.style.display = 'none';

  setAiLabStatus('Curating bespoke matches...');
  if (metricStatus) metricStatus.textContent = 'Searching boutique inventory';

  try {
    const recs = await fetchAiLabRecommendationsFromBackend(ai);
    await new Promise(r => setTimeout(r, 800)); // aesthetic loading time

    if (loadingState) loadingState.style.display = 'none';
    if (recsGrid) recsGrid.style.display = 'grid';

    renderAiLabRecs(ai, recs);

    setAiLabStatus(recs.length ? `Curation complete: ${recs.length} bespoke matches identified.` : 'Neural analysis complete. No optimal matches found in boutique.');

    if (metricLastRun) {
      const now = new Date();
      metricLastRun.textContent = now.toLocaleTimeString();
    }
    if (metricStatus) metricStatus.textContent = 'Idle · ready for next image';

  } catch (error) {
    console.error('[AI LAB] Recs Error:', error);
    if (loadingState) loadingState.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const aiNav = document.getElementById('ai-recs-link');
  const aiBtn = document.getElementById('aiLabRunBtn');
  const goFromUploadBtn = document.getElementById('ai-image-btn');
  const photoInput = document.getElementById('aiLabPhoto');
  const preview = document.getElementById('aiLabPreview');
  const previewImg = document.getElementById('aiLabPreviewImg');
  const previewCaption = document.getElementById('aiLabPreviewCaption');
  const dropZone = document.getElementById('aiLabDropZone');
  const rawToggle = document.getElementById('aiLabRawToggle');
  const rawResponse = document.getElementById('aiLabRawResponse');
  const backBtn = document.getElementById('aiLabBackBtn');
  const confirmBtn = document.getElementById('aiLabConfirmBtn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      proceedToRecommendations();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showAiLabUploadView();
    });
  }

  if (aiNav) {
    aiNav.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('ai-recs-page');
      showAiLabUploadView();
    });
  }

  if (goFromUploadBtn) {
    goFromUploadBtn.addEventListener('click', () => {
      showPage('ai-recs-page');
      showAiLabUploadView();
    });
  }

  if (aiBtn) {
    aiBtn.addEventListener('click', (e) => {
      e.preventDefault();
      runAiLab();
    });
  }

  if (photoInput && preview && previewImg) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      if (!file) {
        preview.style.display = 'none';
        currentUploadedImageUrl = ''; // Reset when no file selected
        setAiLabStatus('Ready. Add a photo and hit Analyze.');
        const metricStatus = document.getElementById('aiLabMetricStatus');
        const metricDot = document.getElementById('aiLabMetricDot');
        if (metricStatus) metricStatus.textContent = 'Idle · waiting for image';
        if (metricDot) metricDot.classList.add('idle');
        return;
      }
      const url = URL.createObjectURL(file);
      previewImg.src = url;
      currentUploadedImageUrl = url; // Store the uploaded image URL globally
      console.log('[AI LAB] Stored uploaded image URL:', url);
      if (previewCaption) {
        const sizeMb = Math.max(0.1, (file.size / (1024 * 1024))).toFixed(1);
        previewCaption.textContent = `${file.name} · ${sizeMb}MB`;
      }
      preview.style.display = 'block';
      setAiLabStatus('Photo loaded. Click "Analyze & Get Outfits".');
      const metricStatus = document.getElementById('aiLabMetricStatus');
      const metricDot = document.getElementById('aiLabMetricDot');
      if (metricStatus) metricStatus.textContent = 'Image ready for analysis';
      if (metricDot) metricDot.classList.remove('idle');
    });
  }

  if (dropZone && photoInput) {
    dropZone.addEventListener('click', (e) => {
      if (e.target === photoInput) return;
      photoInput.click();
    });
  }

  if (rawToggle && rawResponse) {
    rawToggle.addEventListener('click', () => {
      const visible = rawResponse.classList.toggle('visible');
      rawToggle.textContent = visible
        ? 'Hide technical JSON'
        : 'View technical JSON (for debugging)';
    });
  }
});

