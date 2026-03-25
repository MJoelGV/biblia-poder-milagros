// YouTube Player Integration
class YouTubePlayer {
    constructor() {
        this.player = null;
        this.currentVideo = null;
        this.isPlaying = false;
        this.playerReady = false;
    }

    // Inicializar el reproductor de YouTube
    initPlayer() {
        return new Promise((resolve) => {
            // Cargar YouTube IFrame API si no está cargada
            if (typeof YT === 'undefined') {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            // Función que se ejecuta cuando la API está lista
            window.onYouTubeIframeAPIReady = () => {
                this.player = new YT.Player('youtube-player', {
                    height: '0',
                    width: '0',
                    events: {
                        'onReady': (event) => {
                            this.playerReady = true;
                            console.log('YouTube player ready');
                            resolve();
                        },
                        'onStateChange': (event) => {
                            this.onPlayerStateChange(event);
                        },
                        'onError': (event) => {
                            console.error('YouTube player error:', event);
                        }
                    }
                });
            };

            // Si la API ya está cargada
            if (typeof YT !== 'undefined' && YT.Player) {
                window.onYouTubeIframeAPIReady();
            }
        });
    }

    // Cargar y reproducir video
    async loadVideo(videoId, title, speaker) {
        if (!this.playerReady) {
            await this.initPlayer();
        }

        this.currentVideo = { videoId, title, speaker };
        this.player.loadVideoById(videoId);
        this.player.playVideo();
    }

    // Manejar cambios de estado del reproductor
    onPlayerStateChange(event) {
        const state = event.data;
        
        switch (state) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                this.updatePlayPauseButton();
                this.startProgressTracking();
                break;
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                this.updatePlayPauseButton();
                break;
            case YT.PlayerState.ENDED:
                this.onVideoEnded();
                break;
        }
    }

    // Control de reproducción
    play() {
        if (this.player && this.playerReady) {
            this.player.playVideo();
        }
    }

    pause() {
        if (this.player && this.playerReady) {
            this.player.pauseVideo();
        }
    }

    stop() {
        if (this.player && this.playerReady) {
            this.player.stopVideo();
        }
    }

    // Navegación
    previous() {
        // Implementar lógica para video anterior
        if (window.predicacionesApp) {
            window.predicacionesApp.playPrevious();
        }
    }

    next() {
        // Implementar lógica para siguiente video
        if (window.predicacionesApp) {
            window.predicacionesApp.playNext();
        }
    }

    // Control de volumen
    setVolume(volume) {
        if (this.player && this.playerReady) {
            this.player.setVolume(volume);
        }
    }

    // Control de tiempo (seek)
    seekTo(seconds) {
        if (this.player && this.playerReady) {
            this.player.seekTo(seconds, true);
        }
    }

    // Obtener tiempo actual
    getCurrentTime() {
        if (this.player && this.playerReady) {
            return this.player.getCurrentTime();
        }
        return 0;
    }

    // Obtener duración total
    getDuration() {
        if (this.player && this.playerReady) {
            return this.player.getDuration();
        }
        return 0;
    }

    // Actualizar botón play/pause
    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            const icon = playPauseBtn.querySelector('i');
            if (this.isPlaying) {
                icon.className = 'fas fa-pause';
            } else {
                icon.className = 'fas fa-play';
            }
        }
    }

    // Seguimiento de progreso
    startProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.progressInterval = setInterval(() => {
            if (this.isPlaying && window.predicacionesApp) {
                window.predicacionesApp.updateProgress();
            }
        }, 1000);
    }

    // Cuando termina un video
    onVideoEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        
        // Reproducir siguiente video automáticamente
        setTimeout(() => {
            this.next();
        }, 2000);
    }

    // Obtener información del video actual
    getCurrentVideo() {
        return this.currentVideo;
    }

    // Destruir el reproductor
    destroy() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        if (this.player && this.playerReady) {
            this.player.destroy();
        }
    }
}

// Exportar para uso global
window.YouTubePlayer = YouTubePlayer;
