// ===== GERENCIADOR DE PLAYLISTS E FAVORITOS (player-playlists.js) =====

function renderPlaylists() {
    const likedCountTxt = document.getElementById('likedMusicsCountTxt');
    if (likedCountTxt) {
        const favSize = AppState.favorites ? AppState.favorites.size : 0;
        likedCountTxt.textContent = `${favSize} ${favSize === 1 ? 'música' : 'músicas'}`;
    }

    if (!DOM.playlistsContainer) return;
    DOM.playlistsContainer.innerHTML = '';

    if (!AppState.userPlaylists || AppState.userPlaylists.length === 0) {
        DOM.playlistsContainer.innerHTML = `
            <div class="empty-state-box" style="margin-top:12px;">
                <span class="material-symbols-rounded">folder_open</span>
                <p>Nenhuma playlist criada ainda.</p>
            </div>
        `;
        return;
    }

    AppState.userPlaylists.forEach(playlist => {
        const item = document.createElement('div');
        item.className = 'playlist-row-item';
        const count = playlist.musics ? playlist.musics.length : 0;

        item.innerHTML = `
            <div class="playlist-item-left">
                <div class="playlist-icon-box">
                    <span class="material-symbols-rounded">queue_music</span>
                </div>
                <div class="playlist-item-info">
                    <h3>${playlist.name}</h3>
                    <p>${count} ${count === 1 ? 'música' : 'músicas'}</p>
                </div>
            </div>
            <button class="playlist-more-btn">
                <span class="material-symbols-rounded">more_vert</span>
            </button>
        `;

        item.querySelector('.playlist-item-left').addEventListener('click', () => { openPlaylistDetail(playlist); });
        
        item.querySelector('.playlist-more-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.openPlaylistContextMenu === 'function') {
                window.openPlaylistContextMenu(playlist);
            }
        });

        DOM.playlistsContainer.appendChild(item);
    });
}

function openLikedMusicsDetail() {
    AppState.currentPlaylistFilter = 'favorites';
    if (DOM.playlistsRootView) DOM.playlistsRootView.style.display = 'none';
    if (DOM.playlistDetailView) DOM.playlistDetailView.style.display = 'block';

    // === ALTERAÇÃO EXTRA: Esconder a barra de ícones inferior (.nav-bar) ===
    const navBar = document.querySelector('.nav-bar');
    if (navBar) navBar.style.display = 'none';

    const createBtn = document.getElementById('openCreatePlaylistModalBtn');
    if (createBtn) createBtn.style.display = 'none';
    const playlistsTab = document.getElementById('playlists');
    if (playlistsTab) {
        const headers = playlistsTab.querySelectorAll('h1, h2, h3, .playlist-header, .section-title');
        headers.forEach(h => {
            if (h.textContent.toLowerCase().includes('minhas playlist')) h.style.display = 'none';
        });
    }

    const titleEl = document.getElementById('playlistDetailName');
    const countEl = document.getElementById('playlistDetailCount');
    const tracksContainer = document.getElementById('playlistTracksList');

    if (titleEl) titleEl.textContent = "Músicas Curtidas";
    if (!tracksContainer) return;
    tracksContainer.innerHTML = '';

    const likedMusics = AppState.musics.filter(m => AppState.favorites && AppState.favorites.has(m.id));
    if (countEl) countEl.textContent = `${likedMusics.length} ${likedMusics.length === 1 ? 'música' : 'músicas'}`;

    if (likedMusics.length === 0) {
        tracksContainer.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">favorite</span><p>Nenhum favorito.</p></div>`;
        return;
    }

    likedMusics.forEach(music => {
        if (typeof window.createMusicCardElement === 'function') {
            tracksContainer.appendChild(window.createMusicCardElement(music));
        }
    });
}

function openPlaylistDetail(playlist) {
    AppState.currentPlaylistFilter = playlist.id;
    if (DOM.playlistsRootView) DOM.playlistsRootView.style.display = 'none';
    if (DOM.playlistDetailView) DOM.playlistDetailView.style.display = 'block';

    // === ALTERAÇÃO EXTRA: Esconder a barra de ícones inferior (.nav-bar) ===
    const navBar = document.querySelector('.nav-bar');
    if (navBar) navBar.style.display = 'none';

    const createBtn = document.getElementById('openCreatePlaylistModalBtn');
    if (createBtn) createBtn.style.display = 'none';
    const playlistsTab = document.getElementById('playlists');
    if (playlistsTab) {
        const headers = playlistsTab.querySelectorAll('h1, h2, h3, .playlist-header, .section-title');
        headers.forEach(h => {
            if (h.textContent.toLowerCase().includes('minhas playlist')) h.style.display = 'none';
        });
    }

    const titleEl = document.getElementById('playlistDetailName');
    const countEl = document.getElementById('playlistDetailCount');
    const tracksContainer = document.getElementById('playlistTracksList');

    if (titleEl) titleEl.textContent = playlist.name;
    if (!tracksContainer) return;
    tracksContainer.innerHTML = '';

    if (!playlist.musics) playlist.musics = [];
    const playlistMusics = AppState.musics.filter(m => playlist.musics.includes(m.id));
    if (countEl) countEl.textContent = `${playlistMusics.length} ${playlistMusics.length === 1 ? 'música' : 'músicas'}`;

    if (playlistMusics.length === 0) {
        tracksContainer.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">music_note</span><p>Playlist vazia.</p></div>`;
        return;
    }

    playlistMusics.forEach(music => {
        if (typeof window.createMusicCardElement === 'function') {
            tracksContainer.appendChild(window.createMusicCardElement(music));
        }
    });
}

function closePlaylistDetail() {
    AppState.currentPlaylistFilter = null;
    if (DOM.playlistsRootView) DOM.playlistsRootView.style.display = 'block';
    if (DOM.playlistDetailView) DOM.playlistDetailView.style.display = 'none';
    
    // === ALTERAÇÃO EXTRA: Mostrar a barra de ícones inferior (.nav-bar) novamente ao voltar ===
    const navBar = document.querySelector('.nav-bar');
    if (navBar) navBar.style.display = '';

    const createBtn = document.getElementById('openCreatePlaylistModalBtn');
    if (createBtn) createBtn.style.display = '';
    const playlistsTab = document.getElementById('playlists');
    if (playlistsTab) {
        const headers = playlistsTab.querySelectorAll('h1, h2, h3, .playlist-header, .section-title');
        headers.forEach(h => {
            if (h.textContent.toLowerCase().includes('minhas playlist')) h.style.display = '';
        });
    }
    renderPlaylists();
}

function setupPlaylistModal() {
    const triggerBtn = document.getElementById('openCreatePlaylistModalBtn');
    if (triggerBtn) {
        triggerBtn.replaceWith(triggerBtn.cloneNode(true));
        document.getElementById('openCreatePlaylistModalBtn').addEventListener('click', () => {
            AppState.playlistModalMode = 'create';
            document.getElementById('modalPlaylistTitle').textContent = "Criar Nova Playlist";
            if (DOM.newPlaylistName) DOM.newPlaylistName.value = '';
            if (DOM.playlistModal) DOM.playlistModal.classList.add('active');
        });
    }

    if (DOM.cancelModalBtn) {
        DOM.cancelModalBtn.addEventListener('click', () => { if (DOM.playlistModal) DOM.playlistModal.classList.remove('active'); });
    }

    if (DOM.confirmModalBtn) {
        DOM.confirmModalBtn.addEventListener('click', () => {
            const name = DOM.newPlaylistName.value.trim();
            if (!name) return;

            if (AppState.playlistModalMode === 'create') {
                const newPlaylist = { id: Date.now(), name: name, musics: [] };
                if (!AppState.userPlaylists) AppState.userPlaylists = [];
                AppState.userPlaylists.push(newPlaylist);
                if (typeof window.showToast === 'function') window.showToast(`Playlist "${name}" criada!`);
            } else if (AppState.playlistModalMode === 'rename' && AppState.selectedPlaylistForMenu) {
                AppState.selectedPlaylistForMenu.name = name;
                if (typeof window.showToast === 'function') window.showToast("Playlist renomeada com sucesso!");
            }

            savePlaylists(AppState.userPlaylists);
            renderPlaylists();
            if (DOM.playlistModal) DOM.playlistModal.classList.remove('active');
        });
    }
}

function setupPlaylistDetailEvents() {
    if (DOM.backToPlaylistsBtn) DOM.backToPlaylistsBtn.addEventListener('click', closePlaylistDetail);
}

function savePlaylists(playlists) { localStorage.setItem('supabase_player_playlists', JSON.stringify(playlists)); }
function loadPlaylists() { const data = localStorage.getItem('supabase_player_playlists'); return data ? JSON.parse(data) : []; }
function saveFavorites(favs) { localStorage.setItem('supabase_player_favorites', JSON.stringify(favs)); }
function loadFavorites() { const data = localStorage.getItem('supabase_player_favorites'); return data ? JSON.parse(data) : []; }

window.renderPlaylists = renderPlaylists; window.openPlaylistDetail = openPlaylistDetail; window.openLikedMusicsDetail = openLikedMusicsDetail; window.closePlaylistDetail = closePlaylistDetail; window.setupPlaylistModal = setupPlaylistModal; window.setupPlaylistDetailEvents = setupPlaylistDetailEvents; window.savePlaylists = savePlaylists; window.loadPlaylists = loadPlaylists; window.saveFavorites = saveFavorites; window.loadFavorites = loadFavorites;
