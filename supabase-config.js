// CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = 'https://ublmmwatrqvthbcmnrps.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2I4PfvjVCTi5EOPkV-CMBA_bCVl-osH';
const STORAGE_BUCKET = 'music-files';

// Importar Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// CARREGAR MÚSICAS DO SUPABASE
async function loadMusicsFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('musics')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Erro ao carregar músicas:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Erro na requisição:', e);
        return [];
    }
}

// SALVAR MÚSICA NO SUPABASE
async function saveMusicToSupabase(musicData) {
    try {
        const { data, error } = await supabaseClient
            .from('musics')
            .insert([musicData])
            .select();
        
        if (error) {
            console.error('Erro ao salvar música:', error);
            return null;
        }
        
        return data[0];
    } catch (e) {
        console.error('Erro na requisição:', e);
        return null;
    }
}

// DELETAR MÚSICA DO SUPABASE
async function deleteMusicFromSupabase(musicId) {
    try {
        const { error } = await supabaseClient
            .from('musics')
            .delete()
            .eq('id', musicId);
        
        if (error) {
            console.error('Erro ao deletar música:', error);
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Erro na requisição:', e);
        return false;
    }
}

// FAZER UPLOAD DE ARQUIVO
async function uploadFileToSupabase(file, folder) {
    try {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folder}/${fileName}`;
        
        const { data, error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);
        
        if (error) {
            console.error('Erro ao fazer upload:', error);
            return null;
        }
        
        // Obter URL pública
        const { data: publicData } = supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);
        
        return publicData.publicUrl;
    } catch (e) {
        console.error('Erro no upload:', e);
        return null;
    }
}

// SINCRONIZAR MÚSICAS COM SUPABASE
async function syncMusicsWithSupabase() {
    try {
        const musics = await loadMusicsFromSupabase();
        localStorage.setItem('musicPlayerData', JSON.stringify(musics));
        return musics;
    } catch (e) {
        console.error('Erro ao sincronizar:', e);
        return [];
    }
}

window.deleteMusicFromSupabase = deleteMusicFromSupabase;
window.supabaseClient = supabaseClient;
