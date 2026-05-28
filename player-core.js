// ===== ESTADO GLOBAL ÚNICO DO SISTEMA (player-core.js) =====
const AppState = {
    musics: [],
    currentMusicId: null,
    playing: false,
    currentTab: 'musicas',
    lyricsData: [],
    favorites: new Set(),
    userPlaylists: [],
    isShuffle: false,
    isRepeat: false,
    currentPlaylistFilter: null,
    selectedTrackForMenu: null,
    selectedPlaylistForMenu: null,
    playlistModalMode: 'create',
    isUserScrolling: false, 
    userScrollTimeout: null
};

// ===== MAPEAMENTO INTEGRAL DO DOM =====
const DOM = {
    audio: document.getElementById('audio'),
    musicList: document.getElementById('musicList'),
    playlistsContainer: document.getElementById('playlistsContainer'),
    addMusicForm: document.getElementById('addMusicForm'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    currentTimeTxt: document.getElementById('currentTime'),
    totalTimeTxt: document.getElementById('totalTime'),
    playlistModal: document.getElementById('playlistModal'),
    newPlaylistName: document.getElementById('newPlaylistName'),
    confirmModalBtn: document.getElementById('confirmModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    homeTitle: document.getElementById('homeTitle'),
    searchInput: document.getElementById('searchInput'), 
    searchWrapper: document.getElementById('searchWrapper'),
    playlistsRootView: document.getElementById('playlistsRootView'),
    playlistDetailView: document.getElementById('playlistDetailView'),
    backToPlaylistsBtn: document.getElementById('backToPlaylistsBtn'),
    
    // Mini-player e tela expandida
    playerBottomBar: document.getElementById('playerBottomBar'),
    playerBottomCover: document.getElementById('playerBottomCover'),
    playerBottomTitle: document.getElementById('playerBottomTitle'),
    playerBottomArtist: document.getElementById('playerBottomArtist'),
    playerBottomPlayBtn: document.getElementById('playerBottomPlayBtn'),
    miniProgressBar: document.getElementById('miniProgressBar'),
    lyricsFullScreen: document.getElementById('lyricsFullScreen'),
    lyricsTrackTitle: document.getElementById('lyricsTrackTitle'),
    lyricsTrackArtist: document.getElementById('lyricsTrackArtist'),
    lyricsContainer: document.getElementById('lyricsContainer'),
    bigPlayBtn: document.getElementById('bigPlayBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn')
};

// ==========================================
// LÓGICA DE AVANÇAR / VOLTAR MÚSICA
// ==========================================
function playNextMusic() {
    if (!AppState.musics || AppState.musics.length === 0 || !AppState.currentMusicId) return;
    
    const currentIndex = AppState.musics.findIndex(m => m.id === AppState.currentMusicId);
    let nextIndex = currentIndex + 1;
    
    // Se chegou na última música, volta para a primeira
    if (nextIndex >= AppState.musics.length) {
        nextIndex = 0;
    }
    
    playMusicTrack(AppState.musics[nextIndex]);
}

function playPrevMusic() {
    if (!AppState.musics || AppState.musics.length === 0 || !AppState.currentMusicId) return;
    
    const currentIndex = AppState.musics.findIndex(m => m.id === AppState.currentMusicId);
    let prevIndex = currentIndex - 1;
    
    // Se estiver na primeira música, vai para a última
    if (prevIndex < 0) {
        prevIndex = AppState.musics.length - 1;
    }
    
    playMusicTrack(AppState.musics[prevIndex]);
}

// Tornando as funções acessíveis globalmente
window.playNextMusic = playNextMusic;
window.playPrevMusic = playPrevMusic;

// ==========================================
// GESTOS DE TELA (SWIPE)
// ==========================================
function initSwipeGestures() {
    // Alvo onde o gesto deve funcionar (aqui assumi que é na tela principal onde a música aparece)
    const playerArea = DOM.lyricsFullScreen || DOM.playerBottomCover || document.body;
    if (!playerArea) return;

    let touchStartX = 0;
    let touchEndX = 0;

    // Quando o usuário encosta o dedo
    playerArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    // Quando o usuário solta o dedo
    playerArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const SWIPE_THRESHOLD = 60; // Pixels mínimos para ser considerado um "arrasto"

        // Deslizou para a ESQUERDA 
        if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
            playPrevMusic(); // Como solicitado: esquerda vai para a anterior
        }
        
        // Deslizou para a DIREITA 
        if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
            playNextMusic(); // Como solicitado: direita avança
        }
    }
}

// Torna global para poder ser inicializada
window.initSwipeGestures = initSwipeGestures;

// ===== LOGÍSTICA DE REPRODUÇÃO CENTRAL ASYNC =====
async function playMusicTrack(music) {
    if (!DOM.audio || !music) return;
    const isDifferentTrack = AppState.currentMusicId !== music.id;
    AppState.currentMusicId = music.id;
    AppState.playing = true;

    if (isDifferentTrack) {
        DOM.audio.src = music.src;
        let rawLyricsText = "";
        if (music.lrc && (music.lrc.startsWith('http://') || music.lrc.startsWith('https://'))) {
            try {
                const response = await fetch(music.lrc);
                if (response.ok) rawLyricsText = await response.text();
                else rawLyricsText = "[00:00.00] Letra indisponível.";
            } catch (err) {
                rawLyricsText = "[00:00.00] Erro ao carregar letra.";
            }
        } else { rawLyricsText = music.lrc || ""; }

        if (typeof window.parseLyrics === 'function') AppState.lyricsData = window.parseLyrics(rawLyricsText);
        if (typeof window.buildLyricsMarkup === 'function') window.buildLyricsMarkup();
    }

    DOM.audio.play()
        .then(() => {
            if (typeof window.updatePlayerVisibility === 'function') window.updatePlayerVisibility(music);
            if (typeof window.updatePlayerUIState === 'function') window.updatePlayerUIState();
        })
        .catch(() => {
            AppState.playing = false;
            if (typeof window.updatePlayerUIState === 'function') window.updatePlayerUIState();
        });
}

function togglePlayMusic(music) {
    if (!DOM.audio) return;
    if (!music) {
        music = AppState.musics.find(m => m.id === AppState.currentMusicId);
    }
    if (!music) return;

    if (AppState.currentMusicId !== music.id) { playMusicTrack(music); return; }
    if (AppState.playing) { DOM.audio.pause(); AppState.playing = false; }
    else { DOM.audio.play().catch(()=>{}); AppState.playing = true; }
    if (typeof window.updatePlayerUIState === 'function') window.updatePlayerUIState();
}

// CORREÇÃO: Só aparece uma mensagem por vez na tela
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    container.innerHTML = ''; 
    
    const toast = document.createElement('div');
    toast.className = `premium-toast ${type}`;
    const icon = type === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `<span class="material-symbols-rounded">${icon}</span><p style="margin:0;">${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function initTabs() {
    const navButtons = document.querySelectorAll('.nav-bar .nav-btn');
    const tabContents = document.querySelectorAll('.main-content .tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            if (!tabId) return;

            AppState.currentTab = tabId;
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => { t.classList.remove('active'); t.style.display = 'none'; });

            btn.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) { targetTab.classList.add('active'); targetTab.style.display = 'block'; }

            if (DOM.homeTitle) {
                if (tabId === 'musicas') DOM.homeTitle.textContent = 'Músicas';
                else DOM.homeTitle.textContent = ''; 
            }
            if (targetTab) {
                const tabHeaders = targetTab.querySelectorAll('h1, h2, h3, .tab-title, .section-title');
                tabHeaders.forEach(h => {
                    const txt = h.textContent.toLowerCase().trim();
                    if (txt === 'playlists' || txt === 'playlist' || txt === 'adicionar' || txt === 'adicionar música' || txt === 'adicionar músicas') {
                        h.style.display = 'none';
                    }
                });
            }

            if (DOM.searchWrapper) {
                if (tabId === 'musicas') DOM.searchWrapper.style.setProperty('display', 'flex', 'important');
                else DOM.searchWrapper.style.setProperty('display', 'none', 'important');
            }

            if (DOM.searchInput) {
                DOM.searchInput.value = '';
                document.querySelectorAll('#musicList .music-card').forEach(c => c.style.setProperty('display', 'flex', 'important'));
            }

            if (tabId === 'playlists' && typeof window.closePlaylistDetail === 'function') {
                window.closePlaylistDetail();
            }
        });
    });
}

async function loadInitialData() {
    if (typeof window.loadMusicsFromSupabase === 'function') AppState.musics = await window.loadMusicsFromSupabase();
    if (typeof window.renderMusicList === 'function') window.renderMusicList();
    if (typeof window.renderPlaylists === 'function') window.renderPlaylists();
}

function loadLocalStorageData() {
    if (typeof window.loadPlaylists === 'function') AppState.userPlaylists = window.loadPlaylists();
    if (typeof window.loadFavorites === 'function') AppState.favorites = new Set(window.loadFavorites());
}

document.addEventListener('DOMContentLoaded', async () => {
    loadLocalStorageData();
    initTabs();
    if (typeof window.initMenusAndSearch === 'function') window.initMenusAndSearch();
    if (typeof window.setupPlaylistModal === 'function') window.setupPlaylistModal();
    if (typeof window.setupPlaylistDetailEvents === 'function') window.setupPlaylistDetailEvents();
    if (typeof window.initAudioAndLyricsEngine === 'function') window.initAudioAndLyricsEngine();
    
    // VERIFIQUE SE ESTA LINHA ABAIXO EXISTE AQUI!
    if (typeof window.setupAddMusicForm === 'function') window.setupAddMusicForm();
    
    await loadInitialData();
});


window.AppState = AppState; window.DOM = DOM; window.playMusicTrack = playMusicTrack; window.togglePlayMusic = togglePlayMusic; window.showToast = showToast; window.initTabs = initTabs;
