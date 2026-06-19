/**
 * KGS Stream - Educational Streaming Platform Javascript Application
 * Location: web/js/app.js
 */

// Global State
const state = {
  theme: localStorage.getItem('theme') || 'dark',
  batches: [],
  savedBatches: JSON.parse(localStorage.getItem('savedBatches') || '[]'),
  selectedCategory: null, // null means "सभी कोर्सेज"
  searchQuery: '',
  activeBatch: null,
  activeBatchTab: 'live', // 'live' or 'classroom'
  activeSubject: null,
  activeSubjectTab: 'videos', // 'videos' or 'notes',
  lastPath: '#/'
};

// Available Course Categories mapping matching Sidebar buttons
const CATEGORIES = [
  { id: 'all', name: 'सभी कोर्सेज', catId: null, icon: 'graduation-cap' },
  { id: 'bpsc', name: 'BPSC परीक्षा', catId: 1, icon: 'tv', hot: true },
  { id: 'foundation', name: 'फाउंडेशन कोर्सेज', catId: 2, icon: 'book-open' },
  { id: 'recorded', name: 'रिकॉर्डेड बैच', catId: 3, icon: 'video' },
  { id: 'bihar', name: 'बिहार स्पेशल', catId: 4, icon: 'flame' },
  { id: 'offline', name: 'ऑफलाइन क्लासेस', catId: 5, icon: 'users' }
];

// Mobile Sidebar Utility
const sidebar = {
  open: () => {
    const el = document.getElementById('app-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (el && overlay) {
      el.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.add('opacity-100'), 10);
      document.body.style.overflow = 'hidden';
    }
  },
  close: () => {
    const el = document.getElementById('app-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (el && overlay) {
      el.classList.add('-translate-x-full');
      overlay.classList.remove('opacity-100');
      setTimeout(() => overlay.classList.add('hidden'), 300);
      document.body.style.overflow = '';
    }
  }
};

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initSidebar();
  initSearch();
  initModal();
  initMobileNav();

  // Listen to hash changes for Routing
  window.addEventListener('hashchange', () => {
    sidebar.close(); // Auto close sidebar on navigation
    handleRoute();
  });
  
  // Initial Route dispatch
  handleRoute();
});

function initMobileNav() {
  const openBtn = document.getElementById('open-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const overlay = document.getElementById('mobile-sidebar-overlay');

  if (openBtn) openBtn.addEventListener('click', sidebar.open);
  if (closeBtn) closeBtn.addEventListener('click', sidebar.close);
  if (overlay) overlay.addEventListener('click', sidebar.close);
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `flex items-center space-x-3 p-4 rounded-2xl bg-white dark:bg-[#1E222B] border border-slate-100 dark:border-white/10 shadow-2xl pointer-events-auto animate-fade-in transition-all duration-300`;
  
  let iconColor = 'text-emerald-500';
  let iconName = 'check-circle';
  if (type === 'error') {
    iconColor = 'text-rose-500';
    iconName = 'alert-triangle';
  } else if (type === 'info') {
    iconColor = 'text-blue-500';
    iconName = 'info';
  }
  
  toast.innerHTML = `
    <div class="p-1 rounded-lg bg-slate-50 dark:bg-white/5 ${iconColor}">
      <i data-lucide="${iconName}" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 text-xs md:text-sm font-semibold text-slate-800 dark:text-white">${message}</div>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Clock Component
function initClock() {
  const clockEl = document.getElementById('header-live-clock');
  if (!clockEl) return;
  
  const tick = () => {
    const time = new Date().toLocaleTimeString('hi-IN', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    clockEl.textContent = time;
  };
  tick();
  setInterval(tick, 1000);
}

// Dark/Light Theme Control
function initTheme() {
  const toggler = document.getElementById('theme-toggler');
  const sun = document.getElementById('theme-sun-icon');
  const moon = document.getElementById('theme-moon-icon');
  
  const applyTheme = () => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      if (sun) sun.classList.remove('hidden');
      if (moon) moon.classList.add('hidden');
    }
  };
  
  applyTheme();
  
  if (toggler) {
    toggler.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
      applyTheme();
      showToast(`${state.theme === 'dark' ? "Elegant Dark" : "Soft Light"} थीम सक्रिय की गई।`, 'info');
    });
  }
}

// Search Operations
function initSearch() {
  const input = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  
  if (!input) return;
  
  input.value = state.searchQuery;
  
  input.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery) {
      if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
      if (clearBtn) clearBtn.classList.add('hidden');
    }
    
    // Trigger localized dynamic filter based on active view context
    const currentHash = window.location.hash || '#/';
    if (currentHash === '#/') {
      renderBatchesGrid();
    } else if (currentHash === '#/saved') {
      renderSavedView(document.getElementById('app-view-container'));
    } else if (currentHash.startsWith('#/batch/')) {
      if (state.activeBatchTab === 'classroom') {
        filterClassroomSubjects();
      } else {
        filterLiveLectures();
      }
    } else if (currentHash.startsWith('#/subject/')) {
      filterActiveLectures();
    }
  });
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      state.searchQuery = '';
      clearBtn.classList.add('hidden');
      input.focus();
      
      const currentHash = window.location.hash || '#/';
      if (currentHash === '#/') {
        renderBatchesGrid();
      } else if (currentHash === '#/saved') {
        renderSavedView(document.getElementById('app-view-container'));
      } else if (currentHash.startsWith('#/batch/')) {
        if (state.activeBatchTab === 'classroom') {
          filterClassroomSubjects();
        } else {
          filterLiveLectures();
        }
      } else if (currentHash.startsWith('#/subject/')) {
        filterActiveLectures();
      }
    });
  }
}

// Side-bar rendering handler
function initSidebar() {
  const container = document.getElementById('sidebar-categories');
  const navHome = document.getElementById('side-nav-home');
  const navSaved = document.getElementById('side-nav-saved');
  const countBadge = document.getElementById('saved-count-badge');

  const hash = window.location.hash || '#/';

  if (countBadge) countBadge.textContent = state.savedBatches.length;

  // Update Navigation Active States
  if (navHome) {
    const isHome = hash === '#/' || hash === '';
    navHome.className = `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-display font-medium tracking-wide transition-all duration-200 ${
      isHome ? "bg-brand-orange/10 dark:bg-brand-orange/15 text-brand-orange font-bold border-r-3 border-r-brand-orange" : "text-slate-600 dark:text-[#A0A0A0] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white border border-transparent"
    }`;
  }

  if (navSaved) {
    const isSavedView = hash === '#/saved';
    navSaved.className = `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-display font-medium tracking-wide transition-all duration-200 ${
      isSavedView ? "bg-brand-orange/10 dark:bg-brand-orange/15 text-brand-orange font-bold border-r-3 border-r-brand-orange" : "text-slate-600 dark:text-[#A0A0A0] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white border border-transparent"
    }`;
  }
  
  if (container) {
    container.innerHTML = CATEGORIES.map(cat => {
      const isSel = (cat.catId === state.selectedCategory && (hash === '#/' || hash === ''));
      return `
        <button
          data-cat-id="${cat.catId !== null ? cat.catId : 'all'}"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-display font-medium tracking-wide transition-all duration-200 ${
            isSel
              ? "bg-brand-orange/10 dark:bg-brand-orange/15 text-brand-orange font-bold border-r-3 border-r-brand-orange"
              : "text-slate-600 dark:text-[#A0A0A0] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white border border-transparent"
          }"
        >
          <div class="flex items-center space-x-3 pointer-events-none">
            <i data-lucide="${cat.icon}" class="w-4 h-4 ${isSel ? 'text-brand-orange animate-pulse' : 'text-slate-400 dark:text-[#A0A0A0]' }"></i>
            <span>${cat.name}</span>
          </div>
        </button>
      `;
    }).join('');

    // Attach selection Listeners
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rawId = btn.getAttribute('data-cat-id');
        state.selectedCategory = rawId === 'all' ? null : parseInt(rawId);
        window.location.hash = '#/';
        initSidebar();
        renderBatchesGrid();
      });
    });
  }
  
  lucide.createIcons();
}

function toggleSaveBatch(batchId) {
  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) return;

  const index = state.savedBatches.findIndex(b => b.id === batchId);
  if (index === -1) {
    state.savedBatches.push(batch);
    showToast("बैच 'सेव' किया गया", "success");
  } else {
    state.savedBatches.splice(index, 1);
    showToast("बैच 'सेव' से हटाया गया", "info");
  }

  localStorage.setItem('savedBatches', JSON.stringify(state.savedBatches));
  initSidebar();

  const hash = window.location.hash || '#/';
  if (hash === '#/saved') renderSavedView(document.getElementById('app-view-container'));
  else renderBatchesGrid();
}
window.toggleSaveBatch = toggleSaveBatch;

async function fetchNoteAndOpen(noteId) {
  showToast("नोट्स लिंक प्राप्त किया जा रहा है...", "info");
  try {
    const res = await fetch(`api/send.php?action=video&id=${noteId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const pdfUrl = (data.pdfs && data.pdfs[0] && (data.pdfs[0].url || data.pdfs[0].pdf_url)) || data.pdf_url || data.pdf;

    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      showToast("नोट्स ओपन हो रहे हैं।", "success");
    } else {
      showToast("पीडीएफ उपलब्ध नहीं है।", "error");
    }
  } catch (err) {
    showToast("लोड करने में विफलता।", "error");
  }
}
window.fetchNoteAndOpen = fetchNoteAndOpen;

// Router Logic
async function handleRoute() {
  const hash = window.location.hash || '#/';
  state.lastPath = hash;
  
  const viewContainer = document.getElementById('app-view-container');
  const mainContent = document.getElementById('main-content');
  if (!viewContainer) return;

  initSidebar();

  // Smooth scroll main container to top on route change
  if (mainContent) {
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }

  try {
    // 1. Home Grid Route
    if (hash === '#/' || hash === '') {
      await renderHomeView(viewContainer);
    }
    // 2. Saved Batches Route
    else if (hash === '#/saved') {
      await renderSavedView(viewContainer);
    }
    // 3. Batch Detail Route matches: #/batch/:id
    else if (hash.startsWith('#/batch/')) {
      const split = hash.split('/');
      const batchId = parseInt(split[2]);
      if (isNaN(batchId)) {
        window.location.hash = '#/';
      } else {
        await renderBatchDetailView(viewContainer, batchId);
      }
    }
    // 4. Subject lectures Route matches: #/subject/:batchId/:subjectId/:subjectName
    else if (hash.startsWith('#/subject/')) {
      const split = hash.split('/');
      const batchId = parseInt(split[2]);
      const subjectId = parseInt(split[3]);
      const subjectName = decodeURIComponent(split[4] || 'Subject');
      if (isNaN(batchId) || isNaN(subjectId)) {
        window.location.hash = '#/';
      } else {
        await renderSubjectDetailView(viewContainer, batchId, subjectId, subjectName);
      }
    } else {
      window.location.hash = '#/';
    }
  } catch (err) {
    console.error("Routing error:", err);
  }
}

// --- VIEW 0: SAVED VIEW ---
async function renderSavedView(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between py-1">
        <div>
          <h3 class="font-display font-extrabold text-base md:text-lg tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i data-lucide="star" class="w-5 h-5 text-brand-orange fill-brand-orange"></i>
            मेरे सेव किए गए बैच
          </h3>
          <p class="text-xs text-slate-400 dark:text-[#A0A0A0] mt-0.5">आपके पसंदीदा कोर्सेज की सूची</p>
        </div>
        <button onclick="window.location.hash = '#/'" class="text-xs text-brand-orange font-bold hover:underline">और कोर्सेज देखें</button>
      </div>

      <div id="saved-batches-grid"></div>
    </div>
  `;

  const grid = document.getElementById('saved-batches-grid');
  if (state.savedBatches.length === 0) {
    grid.innerHTML = `
      <div class="text-center py-20 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 select-none">
        <i data-lucide="bookmark" class="w-12 h-12 text-slate-200 dark:text-white/5 mx-auto mb-4"></i>
        <h4 class="font-display font-bold text-base text-slate-400">आपने कोई बैच सेव नहीं किया है</h4>
      </div>
    `;
  } else {
    let list = state.savedBatches;
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q));
    }
    grid.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">${
      list.map(batch => renderBatchCardHtml(batch)).join('')
    }</div>`;
  }
  lucide.createIcons();
}

function renderBatchCardHtml(batch) {
  const thumb = batch.image_large || "https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg";
  const category = CATEGORIES.find(c => c.catId === batch.category_id) || { name: 'अन्य कोर्सेज' };
  const isSaved = state.savedBatches.some(b => b.id === batch.id);

  return `
    <div
      onclick="window.location.hash = '#/batch/${batch.id}'"
      class="group bg-white dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:border-brand-orange/40 transition-all duration-200 flex flex-col h-full relative cursor-pointer"
    >
      <button
        onclick="event.stopPropagation(); toggleSaveBatch(${batch.id})"
        class="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-90"
      >
        <i data-lucide="star" class="w-4 h-4 ${isSaved ? 'fill-brand-orange text-brand-orange' : ''}"></i>
      </button>

      <div class="aspect-video w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative select-none">
        <img src="${thumb}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerpolicy="no-referrer" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent w-full"></div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <span class="text-[10px] font-mono font-bold tracking-wider text-brand-orange uppercase">${category.name}</span>
          <h4 class="font-display font-extrabold text-sm md:text-base text-slate-800 dark:text-slate-100 group-hover:text-brand-orange transition-colors leading-snug">${batch.title}</h4>
        </div>
        <div class="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#A0A0A0]">
          <div class="space-y-0.5">
            <p>प्रारंभ: <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${batch.start_at || 'N/A'}</span></p>
          </div>
          <div class="px-4 py-2 text-xs font-display font-bold text-white bg-[#0B0E14] dark:bg-white/5 group-hover:bg-brand-orange dark:group-hover:bg-brand-orange border border-slate-200 dark:border-white/10 group-hover:border-transparent rounded-xl transition-all flex items-center space-x-1">
            <span>अध्ययन करें</span>
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- VIEW 1: HOME VIEW ---
async function renderHomeView(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Live Statistics Header Banner -->
      <div class="rounded-3xl p-6 md:p-8 relative bg-gradient-to-br from-brand-orange/10 via-brand-orange-light/5 to-transparent border border-brand-orange/15 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden select-none">
        <div class="absolute -top-12 -right-12 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="space-y-2 relative z-10">
          <span class="text-[10px] sm:text-xs font-mono tracking-widest text-[#FF6B00] bg-brand-orange/10 px-2.5 py-1 rounded-md border border-brand-orange/20 uppercase font-black">
            BPSC PRELIMS SPECIAL BATCH LIVE
          </span>
          <h1 class="font-display font-black text-2xl md:text-3.5xl text-slate-900 dark:text-white leading-tight tracking-tight pt-1">
            विजेता 3.0 बैच – <span class="bg-gradient-to-r from-brand-orange via-[#FF9500] to-brand-blue bg-clip-text text-transparent">72nd BPSC Prelims</span>
          </h1>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-[#A0A0A0] font-medium pt-2">
            <span class="flex items-center space-x-1.5">
              <i data-lucide="calendar" class="w-4 h-4 text-brand-orange"></i>
              <span>प्रारंभ तिथि: 05 मई 2026</span>
            </span>
            <span class="hidden sm:inline text-slate-300 dark:text-gray-805">•</span>
            <span class="flex items-center space-x-1.5">
              <i data-lucide="tag" class="w-4 h-4 text-[#007AFF]"></i>
              <span>लक्ष्य: 72वीं बीपीएससी परीक्षा</span>
            </span>
            <span class="hidden sm:inline text-slate-300 dark:text-gray-805">•</span>
            <span class="flex items-center space-x-1.5">
              <i data-lucide="users" class="w-4 h-4 text-emerald-500"></i>
              <span>शिक्षक: खान सर एंड टीम</span>
            </span>
          </div>
        </div>

        <button 
          onclick="window.location.hash = '#/batch/1067'"
          class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-display font-bold text-xs md:text-sm tracking-wide shadow-lg cursor-pointer hover:shadow-brand-orange/25 active:scale-95 transition-all self-start md:self-center flex items-center space-x-2"
        >
          <span>अभी पढ़ना शुरू करें</span>
          <i data-lucide="arrow-right" class="w-4 h-4 animate-pulse"></i>
        </button>
      </div>

      <!-- Course Listing Grid Control Area -->
      <div class="space-y-4">
        <div class="flex justify-between items-center select-none pt-2">
          <div>
            <h3 class="font-display font-extrabold text-base md:text-lg tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <i data-lucide="compass" class="w-5 h-5 text-brand-orange animate-spin-slow"></i>
              सक्रिय बैच की सूची
            </h3>
            <p class="text-xs text-slate-400 dark:text-[#A0A0A0] mt-0.5">अपनी परीक्षा का चयन करें और पढ़ाई शुरू करें</p>
          </div>
          <button 
            id="refresh-batches-btn"
            class="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-brand-orange rounded-xl cursor-pointer active:rotate-18 transition-all"
            title="पुनः लोड करें"
          >
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Dynamic Grid Injected Content -->
        <div id="batches-grid" class="min-h-[250px]"></div>
      </div>
    </div>
  `;
  
  lucide.createIcons();
  
  const refreshBtn = document.getElementById('refresh-batches-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      state.batches = [];
      renderGridSkeletons('batches-grid', 6);
      await loadBatchesData();
      renderBatchesGrid();
    });
  }

  // Load batches cache if empty
  if (state.batches.length === 0) {
    renderGridSkeletons('batches-grid', 6);
    await loadBatchesData();
  }
  renderBatchesGrid();
}

// Generate loading placeholders skeleton
function renderGridSkeletons(targetId, count = 4) {
  const target = document.getElementById(targetId);
  if (!target) return;
  
  let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">`;
  for (let i = 0; i < count; i++) {
    html += `
      <div class="bg-white dark:bg-[#12151C] rounded-2xl overflow-hidden animate-pulse border border-slate-200 dark:border-white/10 p-4 space-y-4">
        <div class="aspect-video w-full bg-slate-200 dark:bg-white/5 rounded-xl"></div>
        <div class="space-y-2">
          <div class="h-4 w-1/4 bg-slate-200 dark:bg-white/5 rounded"></div>
          <div class="h-6 w-11/12 bg-slate-200 dark:bg-white/5 rounded"></div>
        </div>
        <div class="flex justify-between items-center pt-2">
          <div class="h-4 w-1/3 bg-slate-200 dark:bg-white/5 rounded"></div>
          <div class="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  target.innerHTML = html;
}

// Fetch Batch configuration array file
async function loadBatchesData() {
  const grid = document.getElementById('batches-grid');
  try {
    const res = await fetch('data/batches.json');
    if (!res.ok) throw new Error('फ़ाइल खोलने में विफलता');
    state.batches = await res.json();
  } catch (error) {
    console.error("Error loading batches table", error);
    showToast("बैच विवरण फ़ाइल लोड करने में समस्या।", "error");
    state.batches = [];
    if (grid) {
      grid.innerHTML = `
        <div class="text-center py-20 bg-white dark:bg-[#12151C] rounded-3xl border border-rose-250/20 text-rose-500 select-none animate-fade-in">
          <i data-lucide="alert-circle" class="w-12 h-12 text-rose-500 mx-auto mb-4"></i>
          <h4 class="font-display font-bold text-base">डेटा लोड करने में त्रुटि</h4>
          <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1 px-4 leading-relaxed max-w-sm mx-auto mb-6">
            सर्वर या नेटवर्क त्रुटि के कारण बैच सूची लोड नहीं हो सकी। कृपया इंटरनेट जांचें।
          </p>
          <button onclick="window.location.reload()" class="px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2 mx-auto">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>पुनः प्रयास करें (Retry)</span>
          </button>
        </div>
      `;
      lucide.createIcons();
    }
  }
}

// Render dynamic batch grid with localized filtering
function renderBatchesGrid() {
  const container = document.getElementById('batches-grid');
  if (!container) return;
  
  // Apply visual category filtering and Search matches
  let filtered = state.batches;
  
  if (state.selectedCategory !== null) {
    filtered = filtered.filter(b => b.category_id === state.selectedCategory);
  }
  
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(b => b.title.toLowerCase().includes(q));
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 select-none animate-fade-in">
        <div class="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="users" class="w-6 h-6 text-slate-300 dark:text-[#A0A0A0]"></i>
        </div>
        <h4 class="font-display font-bold text-base text-slate-800 dark:text-slate-300">कोई सक्रिय बैच नहीं मिला</h4>
        <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1.5 px-4 max-w-sm mx-auto leading-relaxed mb-6">
          आपके खोजे गए शब्द से मेल खाता हुआ कोई बैच नहीं मिला। नई श्रेणी चुनकर देखें।
        </p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-brand-orange-light transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          <span>रिफ्रेश करें (Refresh)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      ${filtered.map(batch => renderBatchCardHtml(batch)).join('')}
    </div>
  `;
  
  lucide.createIcons();
}

// --- VIEW 2: BATCH DETAIL VIEW (LIVES AND CLASSROOM) ---
async function renderBatchDetailView(container, batchId) {
  // Find current active batch meta
  let batch = state.batches.find(b => b.id === batchId);
  if (!batch) {
    await loadBatchesData();
    batch = state.batches.find(b => b.id === batchId);
  }
  
  if (!batch) {
    batch = {
      id: batchId,
      title: "Batch Loading...",
      start_at: "2026-05-05",
      end_at: "2026-08-05",
      image_large: "https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg"
    };
  }
  
  state.activeBatch = batch;
  
  // Render structure
  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Back button and Navigation Context bar -->
      <div class="flex items-center justify-between py-1">
        <button 
          onclick="window.location.hash = '#/'" 
          class="flex items-center space-x-2 text-xs md:text-sm font-display font-semibold text-slate-500 dark:text-[#A0A0A0] hover:text-brand-orange dark:hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <i data-lucide="arrow-left" class="w-4 h-4 text-brand-orange"></i>
          <span>सभी कोर्सेज पर लौटे</span>
        </button>
        
        <span class="text-[10px] md:text-xs font-mono px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full font-bold">
          ID: ${batchId}
        </span>
      </div>

      <!-- Hero Header Banner card with information -->
      <div class="p-6 md:p-8 rounded-3xl bg-slate-50 dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row items-center md:items-stretch gap-6 shadow-md relative overflow-hidden select-none">
        <!-- Thumbnail illustration -->
        <div class="w-full md:w-56 aspect-video rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/5 relative">
          <img 
            src="${batch.image_large || 'https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg'}" 
            alt="${batch.title}" 
            class="w-full h-full object-cover" 
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div class="flex-1 flex flex-col justify-between text-center md:text-left">
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-mono tracking-wider font-bold uppercase inline-block">
              BPSC FOUNDATION COURSE
            </span>
            <h2 class="font-display font-black text-lg md:text-2xl text-slate-800 dark:text-white leading-tight">
              ${batch.title}
            </h2>
          </div>

          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-slate-400 dark:text-[#A0A0A0] pt-2 border-t border-slate-100 dark:border-white/10">
            <div>
              <span>प्रारंभ: </span>
              <span class="font-bold text-slate-700 dark:text-white">${batch.start_at}</span>
            </div>
            <div class="hidden sm:block border-l border-slate-200 dark:border-white/10 h-3"></div>
            <div>
              <span>पंजीकृत छात्र: </span>
              <span class="font-bold text-slate-700 dark:text-white">12k+ एक्टिव</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Segment Tabs menu (Live Classes default) -->
      <div class="flex border-b border-slate-200 dark:border-white/10 pt-2 select-none">
        <button 
          id="tab-btn-live"
          class="px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 ${state.activeBatchTab === 'live' ? 'text-brand-orange tab-active' : 'text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white'}"
        >
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>लाइव क्लासेस (Live)</span>
          </div>
        </button>
        <button 
          id="tab-btn-classroom"
          class="px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 ${state.activeBatchTab === 'classroom' ? 'text-brand-orange tab-active' : 'text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white'}"
        >
          <div class="flex items-center space-x-2">
            <i data-lucide="graduation-cap" class="w-4 h-4"></i>
            <span>क्लासरूम कोर्स (Classroom)</span>
          </div>
        </button>
      </div>

      <!-- Sub-view content section -->
      <div id="batch-sub-container" class="min-h-[200px]"></div>
    </div>
  `;
  
  lucide.createIcons();
  
  // Tab click operations
  const liveTabBtn = document.getElementById('tab-btn-live');
  const classTabBtn = document.getElementById('tab-btn-classroom');
  
  const setTab = (targetTab) => {
    state.activeBatchTab = targetTab;
    if (targetTab === 'live') {
      if (liveTabBtn) liveTabBtn.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-brand-orange tab-active";
      if (classTabBtn) classTabBtn.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white";
      renderLiveClasses(batchId);
    } else {
      if (liveTabBtn) liveTabBtn.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white";
      if (classTabBtn) classTabBtn.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-brand-orange tab-active";
      renderClassroomSubjects(batchId);
    }
  };
  
  if (liveTabBtn) liveTabBtn.addEventListener('click', () => setTab('live'));
  if (classTabBtn) classTabBtn.addEventListener('click', () => setTab('classroom'));
  
  // Fire off start loading tab
  setTab(state.activeBatchTab);
}

// Render SUB-TAB: Live classes lists
let cachedLiveClasses = {};
async function renderLiveClasses(batchId) {
  const container = document.getElementById('batch-sub-container');
  if (!container) return;
  
  renderGridSkeletons('batch-sub-container', 3);
  
  let liveList = [];
  try {
    if (cachedLiveClasses[batchId]) {
      liveList = cachedLiveClasses[batchId];
    } else {
      const URL = `api/send.php?action=today&id=${batchId}`;
      const res = await fetch(URL);
      if (!res.ok) throw new Error("डेटा प्राप्त करने में त्रुटि");
      const json = await res.json();
      
      console.log("Today API Response:", json);

      if (Array.isArray(json)) {
        liveList = json;
      } else if (json && json.todayclasses && Array.isArray(json.todayclasses)) {
        liveList = json.todayclasses;
      } else if (json && json.data && Array.isArray(json.data)) {
        liveList = json.data;
      } else {
        console.warn("Unexpected Today API structure:", json);
        liveList = [];
      }
      cachedLiveClasses[batchId] = liveList;
    }
  } catch (error) {
    console.error("Failed loading Live lectures list", error);
    showToast("लाइव क्लास लोड करने में विफलता।", "error");
    liveList = [];
    
    container.innerHTML = `
      <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-rose-200 dark:border-rose-950 text-rose-500 animate-fade-in select-none">
        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4 text-rose-500"></i>
        <h4 class="font-display font-bold text-base">डेटा लोड करने में असमर्थ</h4>
        <p class="text-xs mt-1 px-4 text-slate-400 dark:text-[#A0A0A0] mb-6">लाइव फीड लोड करते समय एरर आया। कृपया दोबारा चेष्टा करें।</p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          <span>पुनः प्रयास करें (Retry)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  state.currentLiveList = liveList;
  filterLiveLectures();
}

function filterLiveLectures() {
  const container = document.getElementById('batch-sub-container');
  if (!container) return;
  
  let list = state.currentLiveList || [];
  
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) || 
      (item.lesson && item.lesson.name && item.lesson.name.toLowerCase().includes(q))
    );
  }
  
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 animate-fade-in select-none">
        <div class="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="tv" class="w-6 h-6 text-slate-300 dark:text-[#A0A0A0]"></i>
        </div>
        <h4 class="font-display font-bold text-base text-slate-800 dark:text-slate-300">कोई लाइव क्लास उपलब्ध नहीं है</h4>
        <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1.5 px-4 max-w-sm mx-auto leading-relaxed mb-6">
          चिंता न करें! आप तब तक 'क्लासरूम' रिकॉर्डेड लेक्चर खंड का अध्ययन कर सकते हैं।
        </p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-brand-orange-light transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          <span>रिफ्रेश करें (Refresh)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      ${list.map(item => {
        let videoId = extractYouTubeId(item.video_url || item.hd_video_url || '');
        let thumbUrl = "https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg";
        
        if (item.thumb && item.thumb !== "") {
          thumbUrl = item.thumb;
        } else if (videoId) {
          thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
          
        const subjectName = item.name || "BPSC CURRENT CORES";
        const lectureTitle = (item.lesson && item.lesson.name) ? item.lesson.name : "KGS Special Class";
        const publishTime = item.start_at || "10:30 AM";
        const publishDate = item.published_at || "18-06-2026";
        
        return `
          <div class="group bg-white dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-orange/40 transition-all flex flex-col h-full">
            <!-- Thumb video card wrapper -->
            <div class="aspect-video w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative select-none">
              <img 
                src="${thumbUrl}" 
                alt="${lectureTitle}" 
                class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                loading="lazy"
                onerror="this.src='https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg'"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              <span class="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600 text-white font-mono font-bold text-[9px] animate-pulse uppercase tracking-wider">
                LIVE
              </span>
              
              ${item.end_at ? `
                <span class="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-white border border-white/5 font-semibold">
                  Ends: ${item.end_at}
                </span>
              ` : ''}
            </div>

            <!-- Content details block -->
            <div class="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div class="space-y-1">
                <span class="text-[10px] font-mono tracking-wider font-bold text-brand-orange uppercase">
                  ${subjectName}
                </span>
                <h5 class="font-display font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-snug truncate-2-lines h-10">
                  ${lectureTitle}
                </h5>
              </div>

              <!-- Action triggers and timing info -->
              <div class="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11.5px] text-slate-400 dark:text-[#A0A0A0]">
                <div class="space-y-0.5">
                  <p class="font-sans">प्रसारण: <span class="font-mono font-bold text-slate-700 dark:text-white">${publishTime}</span></p>
                  <p class="text-[10px] text-slate-400 dark:text-[#A0A0A0]/50 font-sans">दिनांक: ${publishDate}</p>
                </div>

                <button 
                  onclick="projectVideoModal(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                  class="px-3.5 py-1.5 bg-brand-orange text-white hover:bg-brand-orange-light font-display font-medium rounded-lg text-xs tracking-wider transition-all flex items-center space-x-1 shadow-sm active:scale-95"
                >
                  <span>देखें</span>
                  <i data-lucide="play-circle" class="w-4 h-4 text-white"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  lucide.createIcons();
}

// Render SUB-TAB: Classroom Subject Categories cards
let cachedClassroomSubjects = {};
async function renderClassroomSubjects(batchId) {
  const container = document.getElementById('batch-sub-container');
  if (!container) return;
  
  renderGridSkeletons('batch-sub-container', 4);
  
  let subjectsList = [];
  try {
    if (cachedClassroomSubjects[batchId]) {
      subjectsList = cachedClassroomSubjects[batchId];
    } else {
      const URL = `api/send.php?action=classroom&id=${batchId}`;
      const res = await fetch(URL);
      if (!res.ok) throw new Error("डेटा प्राप्त करने में त्रुटि");
      const json = await res.json();
      
      console.log("Classroom API Response:", json);

      if (Array.isArray(json)) {
        subjectsList = json;
      } else if (json && json.classroom && Array.isArray(json.classroom)) {
        subjectsList = json.classroom;
      } else if (json && json.data && Array.isArray(json.data)) {
        subjectsList = json.data;
      } else {
        console.warn("Unexpected Classroom API structure:", json);
        subjectsList = [];
      }
      cachedClassroomSubjects[batchId] = subjectsList;
    }
  } catch (error) {
    console.error("Failed loading Classroom courses subjects", error);
    showToast("क्लासरूम विषय लोड करने में त्रुटि।", "error");
    subjectsList = [];
    
    container.innerHTML = `
      <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-rose-200 dark:border-rose-950 text-rose-500 animate-fade-in select-none">
        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4 text-rose-500"></i>
        <h4 class="font-display font-bold text-base">विषय लोड करने में त्रुटि</h4>
        <p class="text-xs mt-1 px-4 text-slate-400 dark:text-[#A0A0A0] mb-6">सर्वर से कनेक्ट करने में त्रुटि। कृपया पुनः प्रयास करें।</p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          <span>पुनः प्रयास करें (Retry)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  state.currentSubjectsList = subjectsList;
  filterClassroomSubjects();
}

function filterClassroomSubjects() {
  const container = document.getElementById('batch-sub-container');
  if (!container) return;
  
  let list = state.currentSubjectsList || [];
  
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(item => 
      item.name && item.name.toLowerCase().includes(q)
    );
  }
  
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 animate-fade-in select-none">
        <div class="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="graduation-cap" class="w-6 h-6 text-slate-300 dark:text-[#A0A0A0]"></i>
        </div>
        <h4 class="font-display font-bold text-base text-slate-800 dark:text-slate-300">विषय का विवरण उपलब्ध नहीं है</h4>
        <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1.5 px-4 mx-auto leading-relaxed max-w-sm mb-6">
          खोजे गए नाम से संबंधित कोई विषय इस बैच के क्लासरूम रिकॉर्डिंग में उपलब्ध नहीं है।
        </p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-brand-orange-light transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          <span>रिफ्रेश करें (Refresh)</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      ${list.map(item => {
        let emoji = "📚";
        let subLower = (item.name || "").toLowerCase();
        if (subLower.includes('history') || subLower.includes('इतिहास')) emoji = "🏛️";
        else if (subLower.includes('geography') || subLower.includes('भूगोल')) emoji = "🗺️";
        else if (subLower.includes('polity') || subLower.includes('राजव्यवस्था')) emoji = "⚖️";
        else if (subLower.includes('economy') || subLower.includes('अर्थव्यवस्था')) emoji = "💰";
        else if (subLower.includes('science') || subLower.includes('विज्ञान')) emoji = "🧪";
        else if (subLower.includes('current') || subLower.includes('सामयिकी')) emoji = "📰";
        
        return `
          <div 
            onclick="window.location.hash = '#/subject/${state.activeBatch.id}/${item.id}/${encodeURIComponent(item.name)}'"
            class="group bg-white dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-orange/40 flex items-center justify-between cursor-pointer transition-all duration-300 animate-fade-in"
          >
            <div class="flex items-center space-x-4 min-w-0">
              <!-- Visual Icon emblem with soft background glow -->
              <div class="w-12 h-12 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-xl shrink-0">
                <span>${emoji}</span>
              </div>
              
              <div class="min-w-0">
                <h4 class="font-display font-extrabold text-sm md:text-base text-slate-800 dark:text-slate-100 group-hover:text-brand-orange transition-colors leading-snug">
                  ${item.name}
                </h4>
                <div class="flex items-center space-x-2.5 mt-1 text-xs text-slate-400 dark:text-[#A0A0A0] font-mono">
                  <span class="flex items-center">
                    <span>वीडियो: </span>
                    <span class="font-bold text-slate-700 dark:text-white pl-1">${item.videos !== undefined ? item.videos : 0}</span>
                  </span>
                  <span>•</span>
                  <span class="flex items-center">
                    <span>नोट्स: </span>
                    <span class="font-bold text-slate-700 dark:text-white pl-1">${item.notes !== undefined ? item.notes : 0}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Direction arrow indicator -->
            <button class="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-brand-orange/10 border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-brand-orange transition-all">
              <i data-lucide="arrow-right" class="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"></i>
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  lucide.createIcons();
}

// --- VIEW 3: CLASSROOM SUBJECT ENROLLED RECORDED LECTURES & NOTES ---
async function renderSubjectDetailView(container, batchId, subjectId, subjectName) {
  state.activeSubject = { subjectId, subjectName };
  
  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Back button and Navigation Context bar -->
      <div class="flex items-center justify-between py-1">
        <button 
          onclick="window.location.hash = '#/batch/${batchId}'" 
          class="flex items-center space-x-2 text-xs md:text-sm font-display font-semibold text-slate-500 dark:text-[#A0A0A0] hover:text-brand-orange dark:hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <i data-lucide="arrow-left" class="w-4 h-4 text-brand-orange"></i>
          <span>बैच क्लासरूम पर लौटें</span>
        </button>
        
        <span class="text-[10px] md:text-xs font-mono px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full font-bold">
          ID: ${subjectId}
        </span>
      </div>

      <!-- Subject Description Header Banner card -->
      <div class="p-6 rounded-3xl bg-slate-50 dark:bg-[#12151C]/70 border border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="text-[10px] font-mono font-bold tracking-widest text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded border border-[#007AFF]/20 uppercase">
            क्लासरूम कोर्स लेक्चर्स
          </span>
          <h2 class="font-display font-black text-xl md:text-2xl text-slate-800 dark:text-white leading-tight mt-1">
            ${subjectName}
          </h2>
        </div>
        
        <span class="px-3.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-xs text-slate-400 dark:text-[#A0A0A0] rounded-xl font-mono">
          श्रेणी: मुख्य पाठ्यक्रम
        </span>
      </div>

      <!-- Video / Notes double under-tabs selection -->
      <div class="flex border-b border-slate-200 dark:border-white/10 pt-2 select-none">
        <button 
          id="sub-tab-videos"
          class="px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 ${state.activeSubjectTab === 'videos' ? 'text-brand-orange tab-active' : 'text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white'}"
        >
          <div class="flex items-center space-x-2">
            <i data-lucide="video" class="w-4 h-4"></i>
            <span>वीडियो लेक्चर्स (Videos)</span>
          </div>
        </button>
        <button 
          id="sub-tab-notes"
          class="px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 ${state.activeSubjectTab === 'notes' ? 'text-brand-orange tab-active' : 'text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white'}"
        >
          <div class="flex items-center space-x-2">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            <span>संपादकीय पीडीएफ नोट्स (Notes)</span>
          </div>
        </button>
      </div>

      <!-- Detail Injected lectures grid -->
      <div id="subject-materials-container" class="min-h-[220px]"></div>
    </div>
  `;
  
  lucide.createIcons();
  
  const videoSubTab = document.getElementById('sub-tab-videos');
  const noteSubTab = document.getElementById('sub-tab-notes');
  
  const setSubjectTab = (target) => {
    state.activeSubjectTab = target;
    if (target === 'videos') {
      if (videoSubTab) videoSubTab.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-brand-orange tab-active";
      if (noteSubTab) noteSubTab.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white";
    } else {
      if (videoSubTab) videoSubTab.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-white";
      if (noteSubTab) noteSubTab.className = "px-6 py-3.5 text-xs md:text-sm font-display font-extrabold relative transition-all duration-300 text-brand-orange tab-active";
    }
    loadActiveLectures(subjectId);
  };
  
  if (videoSubTab) videoSubTab.addEventListener('click', () => setSubjectTab('videos'));
  if (noteSubTab) noteSubTab.addEventListener('click', () => setSubjectTab('notes'));
  
  // Default kickoff
  setSubjectTab(state.activeSubjectTab);
}

// Fetch dynamic lesson table containing video list and pdf notes
let cachedSubjectLessons = {};
async function loadActiveLectures(subjectId) {
  const container = document.getElementById('subject-materials-container');
  if (!container) return;
  
  renderGridSkeletons('subject-materials-container', 3);
  
  let material = { videos: [], notes: [] };
  try {
    if (cachedSubjectLessons[subjectId]) {
      material = cachedSubjectLessons[subjectId];
    } else {
      const URL = `api/send.php?action=lesson&id=${subjectId}`;
      const res = await fetch(URL);
      if (!res.ok) throw new Error("डेटा व्याख्यान प्राप्त करने में त्रुटि");
      const json = await res.json();
      
      console.log("Lesson API Response:", json);

      let vids = [];
      let pdfs = [];

      // Case 1: Separate arrays in the object
      if (json.videos && Array.isArray(json.videos)) {
        vids = json.videos;
      }
      if (json.notes && Array.isArray(json.notes)) {
        pdfs = json.notes;
        // If notes is the unified array (it contains videos too), we'll filter it in Case 2
      }

      // Case 2: Unified array that needs filtering
      if (vids.length === 0) {
        let unified = [];
        if (Array.isArray(json)) unified = json;
        else if (json.data && Array.isArray(json.data)) unified = json.data;
        else if (json.notes && Array.isArray(json.notes)) unified = json.notes;

        if (unified.length > 0) {
          vids = unified.filter(item => item.type !== "pdf");
          pdfs = unified.filter(item => item.type === "pdf");
        }
      }

      if (vids.length > 0 || pdfs.length > 0) {
        material = { videos: vids, notes: pdfs };
        cachedSubjectLessons[subjectId] = material;
      } else {
        showToast("इस विषय में कोई सामग्री उपलब्ध नहीं है।", "info");
        material = { videos: [], notes: [] };
      }
    }
  } catch (error) {
    console.error("Failed loading lecture materials list", error);
    showToast("लेक्चर नोट्स सूची लोड करने में त्रुटि प्राप्ति।", "error");
    material = { videos: [], notes: [] };
  }
  
  state.currentMaterial = material;
  filterActiveLectures();
}

function filterActiveLectures() {
  const container = document.getElementById('subject-materials-container');
  if (!container) return;
  
  const materials = state.currentMaterial || { videos: [], notes: [] };
  
  if (state.activeSubjectTab === 'videos') {
    let videos = materials.videos || [];
    
    // Check search filter mapping
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      videos = videos.filter(v => 
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.name && v.name.toLowerCase().includes(q))
      );
    }
    
    if (videos.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 select-none">
          <i data-lucide="video" class="w-12 h-12 text-slate-300 dark:text-[#A0A0A0] mx-auto mb-4"></i>
          <h4 class="font-display font-bold text-base text-slate-800 dark:text-slate-300">कोई वीडियो व्याख्यान उपलब्ध नहीं हैं</h4>
          <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1.5 px-4 max-w-sm mx-auto leading-relaxed mb-6">
            इस विषय में अभी कोई वीडियो लेक्चर अपडेट नहीं हुआ है। अन्य विषयों की जांच करें।
          </p>
          <button onclick="window.location.reload()" class="px-6 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-brand-orange-light transition-all active:scale-95 flex items-center gap-2 mx-auto">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>रिफ्रेश करें (Refresh)</span>
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        ${videos.map(v => {
          let videoId = extractYouTubeId(v.video_url || v.hd_video_url || '');
          let thumbUrl = "https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg";
          
          if (v.thumb && v.thumb !== "") {
            thumbUrl = v.thumb;
          } else if (videoId) {
            thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
          
          const title = v.title || v.name || "वीडियो व्याख्यान";
          const publishDate = v.publish_date || v.published_at || v.date || "10 जून, 2026";
          const duration = v.duration || "45 Mins";
            
          return `
            <div class="group bg-white dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-orange/40 transition-all flex flex-col h-full animate-fade-in">
              
              <!-- Video image wrap frame -->
              <div class="aspect-video w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative select-none">
                <img 
                  src="${thumbUrl}" 
                  alt="${title}" 
                  class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                  onerror="this.src='https://kgs-v2.akamaized.net/kgs/kgs/courses/large/82f0b5d0-3191-40c1-8e53-323e0dfdb3b1.jpg'"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent"></div>
                
                <span class="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-white border border-white/5 font-semibold">
                  ${duration}
                </span>
              </div>

              <!-- content cards -->
              <div class="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-1">
                  <span class="text-[10px] font-mono tracking-wider font-bold text-brand-orange uppercase">
                    ${duration} • HD STREAMS
                  </span>
                  <h5 class="font-display font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-snug truncate-2-lines h-10">
                    ${title}
                  </h5>
                </div>

                <div class="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11.5px] text-slate-400 dark:text-[#A0A0A0]">
                  <span>तिथि: ${publishDate}</span>

                  <button 
                    onclick="projectVideoModal(${JSON.stringify(v).replace(/"/g, '&quot;')})"
                    class="px-3 py-1.5 bg-[#0B0E14] dark:bg-white/5 hover:bg-brand-orange dark:hover:bg-brand-orange text-slate-700 dark:text-white hover:text-white border border-slate-200 dark:border-white/10 hover:border-transparent rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-sm cursor-pointer active:scale-95"
                  >
                    <span>चलाएं</span>
                    <i data-lucide="play" class="w-3 h-3 fill-current"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // NOTES TAB
    let notes = materials.notes || [];
    
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      notes = notes.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.name && n.name.toLowerCase().includes(q))
      );
    }
    
    if (notes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 bg-white dark:bg-[#12151C] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 select-none">
          <i data-lucide="file-text" class="w-12 h-12 text-slate-300 dark:text-[#A0A0A0] mx-auto mb-4"></i>
          <h4 class="font-display font-bold text-base text-slate-800 dark:text-slate-300">कोई पीडीएफ नोट्स उपलब्ध नहीं हैं</h4>
          <p class="text-slate-400 dark:text-[#A0A0A0] text-xs mt-1.5 px-4 max-w-sm mx-auto leading-relaxed mb-6">
            इस विषय के लिए अभी कोई लिखित क्लासरूम पीडीएफ नोट्स पब्लिश नहीं हुए हैं।
          </p>
          <button onclick="window.location.reload()" class="px-6 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-brand-orange-light transition-all active:scale-95 flex items-center gap-2 mx-auto">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>रिफ्रेश करें (Refresh)</span>
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        ${notes.map(note => {
          const title = note.title || note.name || "अध्ययन सामग्री पीडीएफ नोट्स";
          const publishDate = note.publish_date || note.published_at || note.date || "12 जून, 2026";
          const pdfUrl = note.pdf_url || note.pdf || "";
          
          return `
            <div class="group bg-white dark:bg-[#12151C] border border-slate-200/50 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-orange/40 transition-all flex flex-col justify-between h-36 gap-4 animate-fade-in">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <i data-lucide="file-text" class="w-6 h-6"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <h5 class="font-display font-extrabold text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-tight truncate-2-lines h-10 pr-2">
                    ${title}
                  </h5>
                  <p class="text-[10.5px] font-mono text-slate-400 dark:text-[#A0A0A0] mt-1 leading-none">
                    प्रकाशित: ${publishDate} • PDF
                  </p>
                </div>
              </div>

              <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  onclick="fetchNoteAndOpen(${note.id})"
                  class="px-3.5 py-1.5 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 select-none transition-all duration-200 cursor-pointer"
                >
                  <span>नोट्स डाउनलोड</span>
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  lucide.createIcons();
}

// Helper YouTube regex extractor
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- VIEW 4: OTT VIDEO MODAL MANAGEMENT ---
function initModal() {
  const modal = document.getElementById('video-player-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const iframe = document.getElementById('modal-video-iframe');
  const overlay = document.getElementById('modal-video-overlay');
  
  const closeModal = () => {
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (iframe) iframe.src = '';
      if (iframe) iframe.classList.add('hidden');
      if (overlay) overlay.classList.remove('hidden');
    }, 300);
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Also catch Esc key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

// Open and project dynamic video content options asynchronously
async function projectVideoModal(item) {
  const modal = document.getElementById('video-player-modal');
  const iframe = document.getElementById('modal-video-iframe');
  const overlay = document.getElementById('modal-video-overlay');
  const titleEl = document.getElementById('modal-title');
  const badgeEl = document.getElementById('modal-badge');
  const sdBtn = document.getElementById('server-sd-btn');
  const hdBtn = document.getElementById('server-hd-btn');
  const pdfBtn = document.getElementById('modal-pdf-btn');
  const noPdfHint = document.getElementById('no-pdf-hint');
  
  if (!modal) return;
  
  // Set initial elements title
  const videoTitle = item.title || item.name || "वीडियो व्याख्यान";
  titleEl.textContent = videoTitle;
  badgeEl.textContent = "कनेक्ट किया जा रहा है...";
  
  // Reset overlay to instructions guide
  if (overlay) overlay.classList.remove('hidden');
  if (iframe) {
    iframe.src = '';
    iframe.classList.add('hidden');
  }
  
  // Disable playback triggers while loading state is active
  if (sdBtn) {
    sdBtn.disabled = true;
    sdBtn.classList.add('opacity-50', 'cursor-not-allowed');
    sdBtn.onclick = null;
  }
  if (hdBtn) {
    hdBtn.disabled = true;
    hdBtn.classList.add('opacity-50', 'cursor-not-allowed');
    hdBtn.onclick = null;
  }
  if (pdfBtn) pdfBtn.classList.add('hidden');
  if (noPdfHint) noPdfHint.classList.add('hidden');
  
  // Entrance transition
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
  }, 50);
  
  // Fetch play streams from: api/send.php?action=video&id={videoId}
  const videoId = item.id;
  let videoData = null;
  
  try {
    const URL = `api/send.php?action=video&id=${videoId}`;
    const res = await fetch(URL);
    if (!res.ok) throw new Error("वीडियो क्रेडेंशियल प्राप्त करने में त्रुटि");
    videoData = await res.json();
    console.log("Video API Response:", videoData);
  } catch (error) {
    console.error("Failed loading video stream config", error);
    showToast("वीडियो प्लेबैक अनुमति विफल।", "error");
    badgeEl.textContent = "SERVER STATUS: OFFLINE";
    return;
  }
  
  if (!videoData) return;
  
  badgeEl.textContent = item.published_at || item.publish_date || "HD STREAMS ACTIVE";
  
  // Exact mapping keys: video_url, hd_video_url, pdfs
  const sdUrl = videoData.video_url || '';
  const hdUrl = videoData.hd_video_url || '';
  
  const injectIframe = (url) => {
    if (!url) {
      showToast("चयनित स्ट्रीमिंग सर्वर लिंक अनुपलब्ध है।", "error");
      return;
    }
    
    let embedUrl = url;
    let ytId = extractYouTubeId(url);
    if (ytId) {
      embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    }
    
    if (overlay) overlay.classList.add('hidden');
    if (iframe) {
      iframe.src = embedUrl;
      iframe.classList.remove('hidden');
    }
    showToast("स्ट्रीमिंग शुरू की गई। आनंद लें!", "success");
  };
  
  // Check and enable buttons dynamically if URLs exist
  if (sdUrl && sdUrl.trim() !== '') {
    if (sdBtn) {
      sdBtn.disabled = false;
      sdBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      sdBtn.onclick = () => injectIframe(sdUrl);
    }
  } else {
    if (sdBtn) {
      sdBtn.disabled = true;
      sdBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  if (hdUrl && hdUrl.trim() !== '') {
    if (hdBtn) {
      hdBtn.disabled = false;
      hdBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      hdBtn.onclick = () => injectIframe(hdUrl);
    }
  } else {
    if (hdBtn) {
      hdBtn.disabled = true;
      hdBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }
  
  // Parse PDF Notes attachments from: videoData.pdfs array or fallback to item
  let hasPdf = false;
  
  if (videoData.pdfs && Array.isArray(videoData.pdfs) && videoData.pdfs.length > 0) {
    const pdfItem = videoData.pdfs[0];
    const pdfUrl = pdfItem.pdf_url || pdfItem.pdf || pdfItem.url || '';
    if (pdfUrl && pdfUrl.trim() !== '') {
      if (pdfBtn) {
        pdfBtn.href = pdfUrl;
        pdfBtn.classList.remove('hidden');
      }
      if (noPdfHint) noPdfHint.classList.add('hidden');
      hasPdf = true;
    }
  }
  
  // Fallback to item notes pdf if not found on direct endpoint
  if (!hasPdf) {
    const itemPdfUrl = item.pdf_url || (item.pdfs && Array.isArray(item.pdfs) && item.pdfs[0] && (item.pdfs[0].pdf_url || item.pdfs[0].pdf)) || '';
    if (itemPdfUrl && itemPdfUrl.trim() !== '') {
      if (pdfBtn) {
        pdfBtn.href = itemPdfUrl;
        pdfBtn.classList.remove('hidden');
      }
      if (noPdfHint) noPdfHint.classList.add('hidden');
      hasPdf = true;
    }
  }
  
  if (!hasPdf) {
    if (pdfBtn) pdfBtn.classList.add('hidden');
    if (noPdfHint) noPdfHint.classList.remove('hidden');
  }
  
  // Default to autoplaying the HD video stream if available, otherwise SD
  if (hdUrl && hdUrl.trim() !== '') {
    injectIframe(hdUrl);
  } else if (sdUrl && sdUrl.trim() !== '') {
    injectIframe(sdUrl);
  }
}

window.projectVideoModal = projectVideoModal;
