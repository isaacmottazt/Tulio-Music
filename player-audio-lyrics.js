// ===== MOTOR DE ÁUDIO, SINCRONISMO E LETRAS .LRC (player-audio-lyrics.js) =====

function initAudioAndLyricsEngine() {
    if (!DOM.audio) return;

    // Monitoramento de Tempo do Áudio
    DOM.audio.addEventListener('timeupdate', () => {
        const current = DOM.audio.currentTime;
        const duration = DOM.audio.duration || 0;

        // Atualização das Barras de Progresso
        if (duration > 0) {
            const pct = (current / duration) * 100;
            if (DOM.progressFill) DOM.progressFill.style.width = `${pct}%`;
            if (DOM.miniProgressBar) DOM.miniProgressBar.style.width = `${pct}%`;
        }

        // Atualização dos textos de tempo na Tela Cheia
        if (DOM.currentTimeTxt) DOM.currentTimeTxt.textContent = formatTime(current);
        if (DOM.totalTimeTxt && duration > 0) DOM.totalTimeTxt.textContent = formatTime(duration);

        // Sincronismo Linha por Linha da Letra
        updateLyricsHighlight(current);
    });

    // Quando o áudio termina, toca a próxima música automaticamente
    DOM.audio.addEventListener('ended', () => {
        if (AppState.isRepeat) {
            DOM.audio.currentTime = 0;
            DOM.audio.play().catch(()=>{});
        } else {
            handleNextTrack();
        }
    });

    // Cliques nos Botões de Play/Pause Rápidos
    if (DOM.playerBottomPlayBtn) DOM.playerBottomPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlayMusic(); });
    if (DOM.bigPlayBtn) DOM.bigPlayBtn.addEventListener('click', () => togglePlayMusic());

    // Cliques para avançar ou retroceder faixa
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => handleNextTrack());
    if (prevBtn) prevBtn.addEventListener('click', () => handlePrevTrack());

    // Barra de progresso clicável para avançar tempo
    if (DOM.progressBar) {
        DOM.progressBar.addEventListener('click', (e) => {
            const rect = DOM.progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const duration = DOM.audio.duration || 0;
            if (duration > 0) {
                DOM.audio.currentTime = (clickX / width) * duration;
            }
        });
    }

    // Controles de Shuffle e Repeat
    if (DOM.shuffleBtn) {
        DOM.shuffleBtn.addEventListener('click', () => {
            AppState.isShuffle = !AppState.isShuffle;
            DOM.shuffleBtn.classList.toggle('active', AppState.isShuffle);
        });
    }
    if (DOM.repeatBtn) {
        DOM.repeatBtn.addEventListener('click', () => {
            AppState.isRepeat = !AppState.isRepeat;
            DOM.repeatBtn.classList.toggle('active', AppState.isRepeat);
        });
    }

    // Listener para detectar scroll manual do usuário na letra
    const scroller = document.getElementById('lyricsScroller');
    if (scroller) {
        scroller.addEventListener('scroll', () => {
            AppState.isUserScrolling = true;
            clearTimeout(AppState.userScrollTimeout);
            AppState.userScrollTimeout = setTimeout(() => { AppState.isUserScrolling = false; }, 3000);
        });
    }
}

// Processador de Strings .lrc para Array de Objetos
function parseLyrics(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const result = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
        const match = timeReg.exec(line);
        if (match) {
            const min = parseInt(match[1]);
            const sec = parseInt(match[2]);
            const ms = parseInt(match[3]);
            // Converte tudo para segundos absolutos
            const time = min * 60 + sec + (ms > 99 ? ms / 1000 : ms / 100);
            const lyric = line.replace(timeReg, '').trim();
            if (lyric) result.push({ time, text: lyric });
        }
    });
    return result.sort((a, b) => a.time - b.time);
}

// Renderiza as linhas de texto na Tela Cheia
function buildLyricsMarkup() {
    if (!DOM.lyricsContainer) return;
    DOM.lyricsContainer.innerHTML = '';

    if (AppState.lyricsData.length === 0) {
        DOM.lyricsContainer.innerHTML = `<div class="lyric-line active" style="text-align:center; padding-top:40px;">Letra Instrumental ou Não Disponível</div>`;
        return;
    }

    AppState.lyricsData.forEach((line, index) => {
        const p = document.createElement('p');
        p.className = 'lyric-line';
        p.id = `lyric-line-${index}`;
        p.textContent = line.text;
        
        // Se o usuário clicar na linha da letra, o áudio salta para aquele segundo
        p.addEventListener('click', () => {
            if (DOM.audio) DOM.audio.currentTime = line.time;
        });

        DOM.lyricsContainer.appendChild(p);
    });
}

function updateLyricsHighlight(currentTime) {
    if (AppState.lyricsData.length === 0) return;
    
    let activeIndex = -1;
    for (let i = 0; i < AppState.lyricsData.length; i++) {
        if (currentTime >= AppState.lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'));
        const activeLineEl = document.getElementById(`lyric-line-${activeIndex}`);
        
        if (activeLineEl) {
            activeLineEl.classList.add('active');
            
            // Auto-Rolagem Centralizada Inteligente (Só rola se o usuário não estiver mexendo manualmente)
            const scroller = document.getElementById('lyricsScroller');
            if (scroller && !AppState.isUserScrolling) {
                const scrollerHeight = scroller.clientHeight;
                const lineTop = activeLineEl.offsetTop;
                const lineHeight = activeLineEl.clientHeight;
                scroller.scrollTop = lineTop - scrollerHeight / 2 + lineHeight / 2;
            }
        }
    }
}

// Atualização de Estados Visuais dos Botões e Capas do Player Inferior e Superior
function updatePlayerVisibility(music) {
    if (!music) return;
    if (DOM.playerBottomBar) DOM.playerBottomBar.style.display = 'flex';
    if (DOM.playerBottomCover) DOM.playerBottomCover.src = music.cover || 'https://via.placeholder.com/150';
    if (DOM.playerBottomTitle) DOM.playerBottomTitle.textContent = music.title;
    if (DOM.playerBottomArtist) DOM.playerBottomArtist.textContent = music.artist;

    if (DOM.lyricsTrackTitle) DOM.lyricsTrackTitle.textContent = music.title;
    if (DOM.lyricsTrackArtist) DOM.lyricsTrackArtist.textContent = music.artist;
}

function updatePlayerUIState() {
    const icon = AppState.playing ? 'pause' : 'play_arrow';
    
    if (DOM.playerBottomPlayBtn) DOM.playerBottomPlayBtn.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
    if (DOM.bigPlayBtn) DOM.bigPlayBtn.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;

    // Sincroniza os mini botões circulares e estados visuais dos cards de música na lista principal
    document.querySelectorAll('.inline-play-btn').forEach(btn => {
        const cardId = parseInt(btn.getAttribute('data-id'));
        const card = btn.closest('.music-card');
        
        if (cardId === AppState.currentMusicId) {
            btn.classList.add('active-inline');
            if (AppState.playing) {
                btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">pause</span>`;
                card?.classList.add('playing');
                card?.classList.remove('paused');
            } else {
                btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">play_arrow</span>`;
                card?.classList.remove('playing');
                card?.classList.add('paused');
            }
        } else {
            btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">play_arrow</span>`;
            btn.classList.remove('active-inline');
            card?.classList.remove('playing');
            card?.classList.remove('paused');
        }
    });
}

// Funções para Expandir / Encolher a Tela de Letras via Slide Up/Down
function expandLyricsScreen() { if (DOM.lyricsFullScreen) DOM.lyricsFullScreen.classList.add('expanded'); }
function collapseLyricsScreen() { if (DOM.lyricsFullScreen) DOM.lyricsFullScreen.classList.remove('expanded'); }

function handleNextTrack() {
    if (AppState.musics.length === 0) return;
    let nextIndex = 0;
    if (AppState.isShuffle) {
        nextIndex = Math.floor(Math.random() * AppState.musics.length);
    } else {
        const currentIdx = AppState.musics.findIndex(m => m.id === AppState.currentMusicId);
        nextIndex = (currentIdx + 1) % AppState.musics.length;
    }
    playMusicTrack(AppState.musics[nextIndex]);
}

function handlePrevTrack() {
    if (AppState.musics.length === 0) return;
    const currentIdx = AppState.musics.findIndex(m => m.id === AppState.currentMusicId);
    let prevIndex = currentIdx - 1;
    if (prevIndex < 0) prevIndex = AppState.musics.length - 1;
    playMusicTrack(AppState.musics[prevIndex]);
}

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

window.initAudioAndLyricsEngine = initAudioAndLyricsEngine; 
window.parseLyrics = parseLyrics; 
window.buildLyricsMarkup = buildLyricsMarkup; 
window.updatePlayerVisibility = updatePlayerVisibility; 
window.updatePlayerUIState = updatePlayerUIState; 
window.expandLyricsScreen = expandLyricsScreen; 
window.collapseLyricsScreen = collapseLyricsScreen; 
window.handleNextTrack = handleNextTrack; 
window.handlePrevTrack = handlePrevTrack;
