// ===== GERENCIADOR DE INTERFACE E CARDS (player-ui.js) =====

function renderMusicList() {
    if (!DOM.musicList) return;
    DOM.musicList.innerHTML = '';

    if (!AppState.musics || AppState.musics.length === 0) {
        DOM.musicList.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded">music_off</span>
                <p>Nenhuma música encontrada no banco.</p>
            </div>
        `;
        return;
    }

    AppState.musics.forEach(music => {
        const card = createMusicCardElement(music);
        DOM.musicList.appendChild(card);
    });
}

function createMusicCardElement(music) {
    const card = document.createElement('div');
    card.className = 'music-card';
    
    // Configura o estado inicial do card na renderização baseado no estado do player
    const isCurrentTrack = AppState.currentMusicId === music.id;
    if (isCurrentTrack) {
        if (AppState.playing) {
            card.classList.add('playing');
        } else {
            card.classList.add('paused');
        }
    }

    const isFav = AppState.favorites && AppState.favorites.has(music.id);
    const inlineBtnClass = isCurrentTrack ? 'inline-play-btn active-inline' : 'inline-play-btn';
    const inlineIcon = (isCurrentTrack && AppState.playing) ? 'pause' : 'play_arrow';

    card.innerHTML = `
        <div class="music-card-left-wrapper">
            <button class="${inlineBtnClass}" data-id="${music.id}">
                <span class="material-symbols-rounded" style="font-size: 16px;">${inlineIcon}</span>
            </button>
            <img src="${music.cover || 'https://via.placeholder.com/150'}" alt="Capa" class="music-card-cover">
            <div class="music-card-details">
                <h3>${music.title}</h3>
                <p>${music.artist}</p>
            </div>
        </div>
        <div class="music-card-actions">
            <button class="favorite-btn ${isFav ? 'active' : ''}">
                <span class="material-symbols-rounded">favorite</span>
            </button>
            <button class="more-btn">
                <span class="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    `;

    // Evento de Play/Pause ao clicar no corpo do card ou botão
    const playArea = card.querySelector('.music-card-left-wrapper');
    playArea.addEventListener('click', () => {
        if (typeof window.togglePlayMusic === 'function') {
            window.togglePlayMusic(music);
        }
    });

    // Botão de Favoritar (Curtir)
    const favBtn = card.querySelector('.favorite-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteTrack(music.id);
        favBtn.classList.toggle('active', AppState.favorites.has(music.id));
    });

    // Botão Três Pontinhos (Menu de Contexto)
    const moreBtn = card.querySelector('.more-btn');
    moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.openContextMenu === 'function') {
            window.openContextMenu(music);
        }
    });

    return card;
}

function toggleFavoriteTrack(musicId) {
    if (!AppState.favorites) AppState.favorites = new Set();
    
    if (AppState.favorites.has(musicId)) {
        AppState.favorites.delete(musicId);
        if (typeof window.showToast === 'function') window.showToast("Removida dos favoritos", "danger");
    } else {
        AppState.favorites.add(musicId);
        if (typeof window.showToast === 'function') window.showToast("Adicionada aos favoritos!", "success");
    }
    
    // Salva no localStorage para não perder ao recarregar
    localStorage.setItem('supabase_player_favorites', JSON.stringify(Array.from(AppState.favorites)));
    
    // Atualiza contadores e listas abertas
    if (typeof window.renderPlaylists === 'function') window.renderPlaylists();
    if (AppState.currentPlaylistFilter === 'favorites' && typeof window.openLikedMusicsDetail === 'function') {
        window.openLikedMusicsDetail();
    }
}

function loadFavorites() {
    const data = localStorage.getItem('supabase_player_favorites');
    return data ? JSON.parse(data) : [];
}

// Vincula as funções ao escopo global de forma limpa
window.renderMusicList = renderMusicList;
window.createMusicCardElement = createMusicCardElement;
window.toggleFavoriteTrack = toggleFavoriteTrack;
window.loadFavorites = loadFavorites;
