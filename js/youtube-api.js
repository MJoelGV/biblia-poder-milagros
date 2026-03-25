// YouTube API Integration for Pastor Carlos Pleitez Channel
class YouTubeAPI {
    constructor() {
        this.apiKey = 'AIzaSyA5B2vj3m6lMWRrMrF7LP7xD3PsPVTjBzM'; // API Key real
        this.channelId = 'UCqN5y_8Jj4M4Q7Q8Q8Q8Q8Q'; // ID del canal Pastor Carlos Pleitez - NECESITA ACTUALIZARSE
        this.channelHandle = '@pastorcarlospleitez'; // Handle del canal
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    // Obtener información del canal por handle
    async getChannelByHandle() {
        try {
            console.log('Buscando canal con handle:', this.channelHandle);
            const response = await fetch(
                `${this.baseUrl}/channels?part=snippet,contentDetails&forHandle=${this.channelHandle}&key=${this.apiKey}`
            );
            const data = await response.json();
            console.log('Respuesta de la API:', data);
            
            if (data.items && data.items.length > 0) {
                this.channelId = data.items[0].id;
                console.log('Canal encontrado:', data.items[0]);
                return data.items[0];
            }
            console.log('No se encontró el canal');
            return null;
        } catch (error) {
            console.error('Error al obtener canal por handle:', error);
            return null;
        }
    }

    // Obtener información del canal
    async getChannelInfo() {
        try {
            const response = await fetch(
                `${this.baseUrl}/channels?part=snippet,contentDetails&id=${this.channelId}&key=${this.apiKey}`
            );
            const data = await response.json();
            return data.items[0];
        } catch (error) {
            console.error('Error al obtener información del canal:', error);
            return null;
        }
    }

    // Obtener playlist del canal
    async getChannelPlaylists() {
        try {
            const response = await fetch(
                `${this.baseUrl}/playlists?part=snippet,contentDetails&channelId=${this.channelId}&maxResults=50&key=${this.apiKey}`
            );
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error('Error al obtener playlists:', error);
            return [];
        }
    }

    // Obtener videos de una playlist específica
    async getPlaylistVideos(playlistId) {
        try {
            let allVideos = [];
            let nextPageToken = null;

            do {
                const url = `${this.baseUrl}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken || ''}&key=${this.apiKey}`;
                const response = await fetch(url);
                const data = await response.json();
                
                allVideos = allVideos.concat(data.items);
                nextPageToken = data.nextPageToken;
            } while (nextPageToken);

            return allVideos;
        } catch (error) {
            console.error('Error al obtener videos de playlist:', error);
            return [];
        }
    }

    // Obtener detalles de videos (duracion, etc)
    async getVideoDetails(videoIds) {
        try {
            // YouTube API limita a 50 IDs por llamada
            const allDetails = [];
            
            for (let i = 0; i < videoIds.length; i += 50) {
                const batch = videoIds.slice(i, i + 50);
                const response = await fetch(
                    `${this.baseUrl}/videos?part=snippet,contentDetails,statistics&id=${batch.join(',')}&key=${this.apiKey}`
                );
                const data = await response.json();
                
                if (data.items && data.items.length > 0) {
                    allDetails.push(...data.items);
                }
                
                // Pequeña pausa entre llamadas para no exceder límites
                if (i + 50 < videoIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            return allDetails;
        } catch (error) {
            console.error('Error al obtener detalles de videos:', error);
            return [];
        }
    }

    // Convertir duración de ISO 8601 a formato legible
    formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Extraer tags de las playlist para categorización
    extractTags(title, description) {
        const tags = [];
        const text = (title + ' ' + description).toLowerCase();
        
        // Palabras clave comunes en predicaciones
        const keywords = {
            'fe': ['fe', 'creer', 'confiar', 'dios', 'poder'],
            'oracion': ['oración', 'orar', 'rezo', 'oración', 'orar'],
            'sanidad': ['sanidad', 'sanar', 'curación', 'milagro', 'salud'],
            'familia': ['familia', 'hijos', 'matrimonio', 'padres', 'casa'],
            'prosperidad': ['prosperidad', 'dinero', 'riqueza', 'bendición', 'abundancia'],
            'libertad': ['libertad', 'libre', 'liberación', 'cadenas', 'opresión'],
            'amor': ['amor', 'amar', 'cariño', 'afecto', 'corazón'],
            'paz': ['paz', 'tranquilidad', 'calma', 'serenidad'],
            'esperanza': ['esperanza', 'esperar', 'futuro', 'promesa']
        };

        for (const [tag, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word))) {
                tags.push(tag);
            }
        }

        return tags.length > 0 ? tags : ['general'];
    }

    // Transformar datos de YouTube a formato de la app
    transformVideoData(video, playlistTitle = '') {
        return {
            id: video.id,
            title: video.snippet.title,
            speaker: 'Pastor Carlos Pleitez',
            date: video.snippet.publishedAt,
            duration: this.formatDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.medium.url,
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
            description: video.snippet.description,
            tags: this.extractTags(video.snippet.title, video.snippet.description),
            playlist: playlistTitle,
            viewCount: parseInt(video.statistics?.viewCount || 0),
            likeCount: parseInt(video.statistics?.likeCount || 0)
        };
    }

    // Obtener videos recientes del canal (similar a YouTube Streams)
    async getChannelRecentVideos(maxResults = 50) {
        try {
            // Método 1: Usar search para obtener videos del canal ordenados por fecha
            const searchQuery = `channel:${this.channelHandle}`;
            const response = await fetch(
                `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&order=date&type=video&maxResults=${maxResults}&key=${this.apiKey}`
            );
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                console.log('✅ Videos obtenidos via Search API (método preferido)');
                return data.items;
            }
            
            // Método 2: Intentar obtener uploads del canal
            try {
                const channelInfo = await this.getChannelInfo();
                if (channelInfo && channelInfo.contentDetails) {
                    // Buscar playlist de uploads de diferentes formas
                    let uploadsPlaylist = null;
                    
                    // Intentar con relatedPlaylists
                    if (channelInfo.contentDetails.relatedPlaylists) {
                        uploadsPlaylist = channelInfo.contentDetails.relatedPlaylists.find(
                            playlist => playlist.kind === 'youtube#playlist' && 
                            (playlist.snippet.title === 'Uploads' || 
                             playlist.snippet.title.toLowerCase().includes('uploads'))
                        );
                    }
                    
                    // Si no encuentra, intentar con contentDetails.uploads
                    if (!uploadsPlaylist && channelInfo.contentDetails.uploads) {
                        uploadsPlaylist = channelInfo.contentDetails.uploads;
                    }
                    
                    if (uploadsPlaylist) {
                        console.log('✅ Encontrada playlist de uploads');
                        const videos = await this.getPlaylistVideos(uploadsPlaylist);
                        const videoIds = videos.map(v => v.snippet.resourceId.videoId).filter(id => id);
                        
                        if (videoIds.length > 0) {
                            const videoDetails = await this.getVideoDetails(videoIds);
                            return videoDetails || [];
                        }
                    }
                }
            } catch (uploadsError) {
                console.log('⚠️ No se pudo encontrar playlist de uploads:', uploadsError);
            }
            
            console.log('⚠️ Usando método de playlists como fallback final');
            return [];
        } catch (error) {
            console.error('Error al obtener videos recientes del canal:', error);
            return [];
        }
    }
}

// Exportar para uso en otros archivos
window.YouTubeAPI = YouTubeAPI;
