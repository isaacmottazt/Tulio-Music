// DADOS COMPARTILHADOS ENTRE PÁGINAS
const STORAGE_KEY = 'musicPlayerData';
const PLAYLISTS_KEY = 'musicPlaylists';
const FAVORITES_KEY = 'musicFavorites';

// PLAYLIST INICIAL - Formato com arquivos locais
const DEFAULT_MUSICS = [
    {
        id: 1,
        title: "Sinais de Fogo",
        artist: "Preto no Branco",
        src: "sinais.mp3",
        cover: "sinais.jpg",
        lrc: "sinais.lrc"
    },
    {
        id: 2,
        title: "Segunda Música",
        artist: "Outro Artista",
        src: "segunda.mp3",
        cover: "segunda.jpg",
        lrc: "segunda.lrc"
    },
    {
        id: 3,
        title: "Terceira Música",
        artist: "Mais um Artista",
        src: "terceira.mp3",
        cover: "terceira.jpg",
        lrc: "terceira.lrc"
    }
];

// CARREGAR DADOS DO STORAGE
function loadMusicData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            return DEFAULT_MUSICS;
        }
    }
    return DEFAULT_MUSICS;
}

// SALVAR DADOS NO STORAGE
function saveMusicData(musics) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(musics));
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
    }
}

// CARREGAR PLAYLISTS
function loadPlaylists() {
    const stored = localStorage.getItem(PLAYLISTS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao carregar playlists:', e);
            return [];
        }
    }
    return [];
}

// SALVAR PLAYLISTS
function savePlaylists(playlists) {
    try {
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch (e) {
        console.error('Erro ao salvar playlists:', e);
    }
}

// CARREGAR FAVORITOS
function loadFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao carregar favoritos:', e);
            return [];
        }
    }
    return [];
}

// SALVAR FAVORITOS
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error('Erro ao salvar favoritos:', e);
    }
}

// ADICIONAR À PLAYLIST
function addMusicToPlaylist(playlistId, musicId) {
    const playlists = loadPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.musicIds.includes(musicId)) {
        playlist.musicIds.push(musicId);
        savePlaylists(playlists);
        return true;
    }
    return false;
}

// CRIAR NOVA PLAYLIST
function createPlaylist(name) {
    const playlists = loadPlaylists();
    const newId = Math.max(...playlists.map(p => p.id), 0) + 1;
    const newPlaylist = {
        id: newId,
        name,
        musicIds: []
    };
    playlists.push(newPlaylist);
    savePlaylists(playlists);
    return newPlaylist;
}

// ADICIONAR/REMOVER FAVORITO
function toggleFavorite(musicId) {
    const favorites = loadFavorites();
    const index = favorites.indexOf(musicId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(musicId);
    }
    saveFavorites(favorites);
    return favorites.includes(musicId);
}

// VERIFICAR SE É FAVORITO
function isFavorite(musicId) {
    const favorites = loadFavorites();
    return favorites.includes(musicId);
}

// FORMATAR TEMPO
function formatTime(time) {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// PROCESSAR LETRAS (LRC)
function parseLyrics(lrcText) {
    if (!lrcText) return [];
    const lines = lrcText.split('\n');
    const lyrics = [];
    lines.forEach(line => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            lyrics.push({
                time: minutes * 60 + seconds,
                text: match[3].trim()
            });
        }
    });
    return lyrics;
}

// CARREGAR ARQUIVO LRC
async function loadLrcFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) return "";
        return await response.text();
    } catch (e) {
        console.error('Erro ao carregar arquivo LRC:', e);
        return "";
    }
}

// INICIALIZAR DADOS
if (!localStorage.getItem(STORAGE_KEY)) {
    saveMusicData(DEFAULT_MUSICS);
}
