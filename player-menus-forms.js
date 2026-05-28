// ===== CONTROLADOR DE MENUS, PESQUISA E CONTEXTOS AVANÇADOS (player-menus-forms.js) =====

function initMenusAndSearch() {
    if (DOM.searchInput) {
        // Realiza o filtro em tempo real
        DOM.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('#musicList .music-card');
            cards.forEach(card => {
                const title = card.querySelector('.music-card-details h3')?.textContent.toLowerCase() || '';
                const artist = card.querySelector('.music-card-details p')?.textContent.toLowerCase() || '';
                if (title.includes(term) || artist.includes(term)) {
                    card.style.setProperty('display', 'flex', 'important');
                } else {
                    card.style.setProperty('display', 'none', 'important');
                }
            });
        });

        // Esconde mini-player e nav-bar ao abrir o teclado virtual (focus)
        DOM.searchInput.addEventListener('focus', () => {
            const navBar = document.querySelector('.nav-bar');
            if (navBar) navBar.style.setProperty('display', 'none', 'important');
            if (DOM.playerBottomBar) DOM.playerBottomBar.style.setProperty('display', 'none', 'important');
        });

        // Retorna a visibilidade dos elementos ao fechar o teclado (blur)
        DOM.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                const navBar = document.querySelector('.nav-bar');
                if (navBar) navBar.style.setProperty('display', 'flex', 'important');
                // Só exibe a barra inferior do player se houver alguma faixa carregada/selecionada
                if (DOM.playerBottomBar && AppState.currentMusicId) {
                    DOM.playerBottomBar.style.setProperty('display', 'flex', 'important');
                }
            }, 180); // Pequeno delay estratégico para animação nativa do teclado sumindo
        });
    }
    createContextMenuMarkup();
}

// Criador Dinâmico da Caixa de Confirmação Totalmente Estilizada (Premium Confirm)
function showPremiumConfirm(title, message, onConfirm) {
    const existing = document.getElementById('premiumConfirmModal');
    if (existing) existing.remove();
    
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'premiumConfirmModal';
    modalBackdrop.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(7, 4, 11, 0.82); backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px); display: flex; align-items: center;
        justify-content: center; z-index: 15000; opacity: 0;
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 24px; box-sizing: border-box;
    `;
    
    modalBackdrop.innerHTML = `
        <div style="
            background: #140f1f; border: 1px solid rgba(255, 62, 107, 0.25);
            border-radius: 20px; width: 100%; max-width: 326px; padding: 24px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 30px rgba(255, 62, 107, 0.05);
            text-align: center; transform: scale(0.85);
            transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ">
            <div style="
                width: 56px; height: 56px; background: rgba(255, 62, 107, 0.1);
                border-radius: 50%; display: flex; align-items: center;
                justify-content: center; margin: 0 auto 16px auto;
            ">
                <span class="material-symbols-rounded" style="font-size: 30px; color: #ff3e6b;">delete_forever</span>
            </div>
            <h3 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 700; color: #fff; letter-spacing: -0.3px;">${title}</h3>
            <p style="margin: 0 0 24px 0; font-size: 13.5px; color: rgba(255,255,255,0.5); line-height: 1.5; padding: 0 4px;">${message}</p>
            <div style="display: flex; gap: 12px;">
                <button id="pConfirmCancelBtn" style="
                    flex: 1; padding: 13px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); font-weight: 600;
                    cursor: pointer; font-size: 14px; transition: background 0.2s;
                ">Cancelar</button>
                <button id="pConfirmActionBtn" style="
                    flex: 1; padding: 13px; border-radius: 12px; border: none;
                    background: #ff3e6b; color: white; font-weight: 600;
                    cursor: pointer; font-size: 14px; box-shadow: 0 6px 16px rgba(255, 62, 107, 0.25);
                ">Excluir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalBackdrop);
    
    // Aciona as transições de entrada suaves
    setTimeout(() => {
        modalBackdrop.style.opacity = '1';
        modalBackdrop.querySelector('div').style.transform = 'scale(1)';
    }, 20);
    
    const closeConfirm = () => {
        modalBackdrop.style.opacity = '0';
        modalBackdrop.querySelector('div').style.transform = 'scale(0.85)';
        setTimeout(() => modalBackdrop.remove(), 220);
    };
    
    modalBackdrop.querySelector('#pConfirmCancelBtn').addEventListener('click', closeConfirm);
    modalBackdrop.querySelector('#pConfirmActionBtn').addEventListener('click', () => {
        onConfirm();
        closeConfirm();
    });
}

function createContextMenuMarkup() {
    let backdrop = document.getElementById('contextMenuBackdrop');
    let menu = document.getElementById('contextMenuModal');
    if (!backdrop) {
        backdrop = document.createElement('div'); backdrop.id = 'contextMenuBackdrop'; backdrop.className = 'context-menu-backdrop';
        document.body.appendChild(backdrop);
    }
    if (!menu) {
        menu = document.createElement('div'); menu.id = 'contextMenuModal'; menu.className = 'context-menu-modal';
        document.body.appendChild(menu);
    }
    backdrop.addEventListener('click', closeContextMenu);
}

function openContextMenu(music) {
    AppState.selectedTrackForMenu = music;
    const menu = document.getElementById('contextMenuModal');
    const backdrop = document.getElementById('contextMenuBackdrop');
    if (!menu || !backdrop) return;

    let contextualButtons = '';

    if (AppState.currentPlaylistFilter === 'favorites') {
        contextualButtons = `
            <button class="menu-option-btn danger" onclick="toggleFavoriteFromMenu(${music.id})">
                <span class="material-symbols-rounded">heart_broken</span> Remover dos Favoritos
            </button>
        `;
    } else if (AppState.currentPlaylistFilter) {
        contextualButtons = `
            <button class="menu-option-btn danger" onclick="removeTrackFromCurrentPlaylist(${music.id})">
                <span class="material-symbols-rounded">playlist_remove</span> Remover desta Playlist
            </button>
        `;
    } else {
        let playlistsOptions = '';
        if (AppState.userPlaylists && AppState.userPlaylists.length > 0) {
            playlistsOptions = `
                <button class="menu-option-btn" onclick="showPlaylistsSubMenu()">
                    <span class="material-symbols-rounded">playlist_add</span> Adicionar à Playlist...
                </button>
            `;
        } else {
            playlistsOptions = `<button class="menu-option-btn" disabled><span class="material-symbols-rounded">block</span> Nenhuma playlist criada</button>`;
        }
        
        contextualButtons = `
            ${playlistsOptions}
            <button class="menu-option-btn danger" onclick="deleteTrackFromSystem(${music.id})">
                <span class="material-symbols-rounded">delete</span> Eliminar música do sistema (Banco)
            </button>
        `;
    }

    menu.innerHTML = `
        <div style="font-weight:600; padding:4px 12px 12px; border-bottom:1px solid rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); font-size:13px; text-align:left;">
            Música: ${music.title}
        </div>
        ${contextualButtons}
        <button class="menu-option-btn" style="margin-top:8px; background:rgba(255,255,255,0.04); justify-content:center;" onclick="closeContextMenu()">
            Fechar
        </button>
    `;

    backdrop.classList.add('active');
    menu.classList.add('active');
}

window.showPlaylistsSubMenu = function() {
    const menu = document.getElementById('contextMenuModal');
    let playlistsOptions = '';
    
    if (AppState.userPlaylists && AppState.userPlaylists.length > 0) {
        playlistsOptions = AppState.userPlaylists.map(pl => `
            <button class="menu-option-btn" onclick="addTrackToPlaylist(${pl.id})">
                <span class="material-symbols-rounded">queue_music</span> ${pl.name}
            </button>
        `).join('');
    } else {
        playlistsOptions = `<div style="padding: 16px; color: rgba(255,255,255,0.4); font-size: 13px; text-align: center;">Nenhuma playlist criada.</div>`;
    }

    menu.innerHTML = `
        <div style="font-weight:600; padding:4px 12px 12px; border-bottom:1px solid rgba(255,255,255,0.05); color:white; font-size:14px; text-align:left; display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-rounded" style="font-size:20px; cursor:pointer; color:rgba(255,255,255,0.6);" onclick="openContextMenu(AppState.selectedTrackForMenu)">arrow_back</span>
            Escolher Playlist
        </div>
        <div style="max-height: 45vh; overflow-y: auto; margin-top: 8px;">
            ${playlistsOptions}
        </div>
        <button class="menu-option-btn" style="margin-top:8px; background:rgba(255,255,255,0.04); justify-content:center;" onclick="closeContextMenu()">
            Cancelar
        </button>
    `;
};

function openPlaylistContextMenu(playlist) {
    AppState.selectedPlaylistForMenu = playlist;
    const menu = document.getElementById('contextMenuModal');
    const backdrop = document.getElementById('contextMenuBackdrop');
    if (!menu || !backdrop) return;

    menu.innerHTML = `
        <div style="font-weight:600; padding:4px 12px 12px; border-bottom:1px solid rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); font-size:13px; text-align:left;">
            Playlist: ${playlist.name}
        </div>
        <button class="menu-option-btn" onclick="triggerRenamePlaylistForm()">
            <span class="material-symbols-rounded">edit</span> Renomear Playlist
        </button>
        <button class="menu-option-btn" onclick="triggerAddTracksToPlaylistView()">
            <span class="material-symbols-rounded">library_add</span> Adicionar Músicas a Ela
        </button>
        <button class="menu-option-btn danger" onclick="deletePlaylistEntirely(${playlist.id})">
            <span class="material-symbols-rounded">delete_forever</span> Apagar Playlist
        </button>
        <button class="menu-option-btn" style="margin-top:8px; background:rgba(255,255,255,0.04); justify-content:center;" onclick="closeContextMenu()">
            Fechar
        </button>
    `;

    backdrop.classList.add('active');
    menu.classList.add('active');
}

function closeContextMenu() {
    const menu = document.getElementById('contextMenuModal');
    const backdrop = document.getElementById('contextMenuBackdrop');
    if (menu) menu.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function triggerRenamePlaylistForm() {
    closeContextMenu();
    const pl = AppState.selectedPlaylistForMenu;
    if (!pl) return;
    AppState.playlistModalMode = 'rename';
    document.getElementById('modalPlaylistTitle').textContent = "Renomear Playlist";
    if (DOM.newPlaylistName) DOM.newPlaylistName.value = pl.name;
    if (DOM.playlistModal) DOM.playlistModal.classList.add('active');
}

function triggerAddTracksToPlaylistView() {
    window.showTracksSubMenuForPlaylist();
}

window.showTracksSubMenuForPlaylist = function() {
    const playlist = AppState.selectedPlaylistForMenu;
    if (!playlist) return;
    const menu = document.getElementById('contextMenuModal');
    if (!menu) return;
    
    if (!playlist.musics) playlist.musics = [];
    
    let tracksOptions = '';
    if (AppState.musics && AppState.musics.length > 0) {
        tracksOptions = AppState.musics.map(music => {
            const isAlreadyIn = playlist.musics.includes(music.id);
            return `
                <button class="menu-option-btn" onclick="toggleTrackInPlaylist(${music.id}, ${playlist.id}); event.stopPropagation();" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                        <span class="material-symbols-rounded" style="color: ${isAlreadyIn ? '#1db954' : 'rgba(255,255,255,0.4)'};">
                            ${isAlreadyIn ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <div>
                            <div style="font-weight:500; color:white; font-size:14px;">${music.title}</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.5);">${music.artist || 'Artista'}</div>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    } else {
        tracksOptions = `<div style="padding: 16px; color: rgba(255,255,255,0.4); font-size: 13px; text-align: center;">Nenhuma música disponível no sistema.</div>`;
    }

    menu.innerHTML = `
        <div style="font-weight:600; padding:4px 12px 12px; border-bottom:1px solid rgba(255,255,255,0.05); color:white; font-size:14px; text-align:left; display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-rounded" style="font-size:20px; cursor:pointer; color:rgba(255,255,255,0.6);" onclick="openPlaylistContextMenu(AppState.selectedPlaylistForMenu)">arrow_back</span>
            Selecionar para "${playlist.name}"
        </div>
        <div style="max-height: 45vh; overflow-y: auto; margin-top: 8px;">
            ${tracksOptions}
        </div>
        <button class="menu-option-btn" style="margin-top:8px; background:rgba(255,255,255,0.04); justify-content:center; color:#1db954; font-weight:600;" onclick="closeContextMenu()">
            Concluir
        </button>
    `;
};

window.toggleTrackInPlaylist = function(musicId, playlistId) {
    const playlist = AppState.userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;
    if (!playlist.musics) playlist.musics = [];
    
    const index = playlist.musics.indexOf(musicId);
    if (index > -1) {
        playlist.musics.splice(index, 1);
        if (typeof window.showToast === 'function') window.showToast("Removida da playlist!", "danger");
    } else {
        playlist.musics.push(musicId);
        if (typeof window.showToast === 'function') window.showToast("Adicionada à playlist!", "success");
    }
    
    if (typeof window.savePlaylists === 'function') window.savePlaylists(AppState.userPlaylists);
    if (typeof window.renderPlaylists === 'function') window.renderPlaylists();
    
    if (AppState.currentPlaylistFilter === playlistId && typeof window.openPlaylistDetail === 'function') {
        window.openPlaylistDetail(playlist);
    }
    window.showTracksSubMenuForPlaylist();
};

window.toggleFavoriteFromMenu = function(musicId) {
    if (AppState.favorites) {
        AppState.favorites.delete(musicId);
        if (typeof window.saveFavorites === 'function') window.saveFavorites(Array.from(AppState.favorites));
        if (typeof window.openLikedMusicsDetail === 'function') window.openLikedMusicsDetail();
        if (typeof window.showToast === 'function') window.showToast("Removido dos favoritos!", "danger");
    }
    closeContextMenu();
};

function deletePlaylistEntirely(playlistId) {
    closeContextMenu();
    const playlist = AppState.userPlaylists.find(p => p.id === playlistId);
    const playlistName = playlist ? playlist.name : "esta playlist";
    
    showPremiumConfirm(
        "Apagar Playlist?", 
        `Tem certeza que deseja remover "${playlistName}"? As músicas originais não serão alteradas.`, 
        () => {
            AppState.userPlaylists = AppState.userPlaylists.filter(p => p.id !== playlistId);
            if (typeof window.savePlaylists === 'function') window.savePlaylists(AppState.userPlaylists);
            if (typeof window.renderPlaylists === 'function') window.renderPlaylists();
            if (typeof window.showToast === 'function') window.showToast("Playlist removida com sucesso!", 'danger');
        }
    );
}

function removeTrackFromCurrentPlaylist(musicId) {
    const playlist = AppState.userPlaylists.find(p => p.id === AppState.currentPlaylistFilter);
    if (playlist && playlist.musics) {
        playlist.musics = playlist.musics.filter(id => id !== musicId);
        if (typeof window.savePlaylists === 'function') window.savePlaylists(AppState.userPlaylists);
        if (typeof window.openPlaylistDetail === 'function') window.openPlaylistDetail(playlist);
        if (typeof window.showToast === 'function') window.showToast("Música removida da playlist!", 'danger');
    }
    closeContextMenu();
}

function addTrackToPlaylist(playlistId) {
    const music = AppState.selectedTrackForMenu;
    if (!music) return;
    const playlist = AppState.userPlaylists.find(p => p.id === playlistId);
    if (playlist) {
        if (!playlist.musics) playlist.musics = [];
        if (!playlist.musics.includes(music.id)) {
            playlist.musics.push(music.id);
            if (typeof window.savePlaylists === 'function') window.savePlaylists(AppState.userPlaylists);
            if (typeof window.renderPlaylists === 'function') window.renderPlaylists();
            if (typeof window.showToast === 'function') window.showToast(`Adicionado à playlist "${playlist.name}"!`);
        } else {
            if (typeof window.showToast === 'function') window.showToast("Esta música já está na playlist.", 'danger');
        }
    }
    closeContextMenu();
}

async function deleteTrackFromSystem(musicId) {
    closeContextMenu();
    const music = AppState.musics.find(m => m.id === musicId);
    const musicTitle = music ? music.title : "esta música";

    showPremiumConfirm(
        "Eliminar do Banco?", 
        `Deseja deletar permanentemente "${musicTitle}" de toda a base de dados do sistema?`, 
        async () => {
            try {
                // CORREÇÃO: Chama a função estruturada do seu supabase-config.js
                let success = false;
                if (typeof window.deleteMusicFromSupabase === 'function') {
                    success = await window.deleteMusicFromSupabase(musicId);
                } else if (typeof supabaseClient !== 'undefined') {
                    const { error } = await supabaseClient.from('musics').delete().eq('id', musicId);
                    success = !error;
                }

                if (success) {
                    // Remove do estado local do app para sumir da tela imediatamente
                    AppState.musics = AppState.musics.filter(m => m.id !== musicId);
                    AppState.userPlaylists.forEach(pl => { 
                        if (pl.musics) pl.musics = pl.musics.filter(id => id !== musicId); 
                    });
                    
                    // Atualiza a interface e o armazenamento local
                    if (typeof window.savePlaylists === 'function') window.savePlaylists(AppState.userPlaylists);
                    if (typeof window.renderMusicList === 'function') window.renderMusicList();
                    
                    if (typeof window.showToast === 'function') window.showToast("Música apagada do sistema!", 'danger');
                } else {
                    if (typeof window.showToast === 'function') window.showToast("Não foi possível remover do banco.", 'danger');
                }
            } catch (err) {
                console.error("Erro ao deletar faixa:", err);
                if (typeof window.showToast === 'function') window.showToast("Erro ao apagar faixa.", 'danger');
            }
        }
    );
}

// ===== NOVA FUNÇÃO: ENVIO PARA O SUPABASE =====
function setupAddMusicForm() {
    if (!DOM.addMusicForm) return;

    DOM.addMusicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (typeof window.showToast === 'function') {
            window.showToast("Enviando música para o banco... Aguarde.", "success");
        }

        const titleInput = document.getElementById('formTitle').value; 
        const artistInput = document.getElementById('formArtist').value;
        const audioFile = document.getElementById('formMusicFile').files[0];
        const coverFile = document.getElementById('formCoverFile').files[0];
        const lrcFile = document.getElementById('formLrcFile').files[0];

        if (!titleInput || !audioFile) {
            if (typeof window.showToast === 'function') window.showToast("Título e áudio são obrigatórios!", "danger");
            return;
        }

        try {
            // CORREÇÃO 1: Faz o upload do áudio para a pasta 'musics' (e não 'audios')
            const audioUrl = await uploadFileToSupabase(audioFile, 'musics');
            if (!audioUrl) throw new Error("Falha no upload do áudio.");

            // Faz o upload da capa para a pasta 'covers'
            let coverUrl = null;
            if (coverFile) {
                coverUrl = await uploadFileToSupabase(coverFile, 'covers');
            }

            // CORREÇÃO 2: Faz o upload do arquivo de letras (.lrc) para a pasta 'lyrics'
            let lrcUrl = "";
            if (lrcFile) { 
                lrcUrl = await uploadFileToSupabase(lrcFile, 'lyrics'); 
            }

            const musicData = {
                title: titleInput,
                artist: artistInput || "Artista Desconhecido",
                src: audioUrl,
                cover: coverUrl || 'https://via.placeholder.com/150',
                lrc: lrcUrl // Agora a letra também é salva no banco
            };

            const savedMusic = await saveMusicToSupabase(musicData);

            if (savedMusic) {
                AppState.musics.unshift(savedMusic);
                if (typeof window.renderMusicList === 'function') window.renderMusicList();
                
                if (typeof window.showToast === 'function') window.showToast("Música adicionada com sucesso!", "success");
                DOM.addMusicForm.reset(); 
            }
        } catch (error) {
            console.error("Erro no processo de salvamento:", error);
            if (typeof window.showToast === 'function') window.showToast("Erro ao salvar música no banco.", "danger");
        }
    });
}



// ===== EXPORTAÇÕES GLOBAIS =====
window.initMenusAndSearch = initMenusAndSearch; 
window.openContextMenu = openContextMenu; 
window.openPlaylistContextMenu = openPlaylistContextMenu; 
window.closeContextMenu = closeContextMenu; 
window.addTrackToPlaylist = addTrackToPlaylist; 
window.removeTrackFromCurrentPlaylist = removeTrackFromCurrentPlaylist; 
window.triggerRenamePlaylistForm = triggerRenamePlaylistForm;
window.setupAddMusicForm = setupAddMusicForm; // Exportando a nova função