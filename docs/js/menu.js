// Función para alternar el menú
function toggleMenu() {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');
    const body = document.body;
    
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Bloquear/desbloquear el scroll del body
    if (sideMenu.classList.contains('active')) {
        body.style.overflow = 'hidden';
    } else {
        body.style.overflow = '';
    }
}

// Función para inicializar el menú
function initMenu() {
    // Crear elementos del menú si no existen
    if (!document.getElementById('side-menu')) {
        const menuHTML = `
            <div id="side-menu" class="side-menu">
                <div class="menu-header">
                    <div class="menu-title">Menú</div>
                    <button class="close-menu" onclick="toggleMenu()">&times;</button>
                </div>
                <ul>
                    <li><a href="index.html"><i class="fas fa-home"></i>Inicio</a></li>
                    <li><a href="lectura.html"><i class="fas fa-bible"></i>Leer Biblia</a></li>
                    <li><a href="pericopas-standalone.html"><i class="fas fa-book-reader"></i>Perícopas</a></li>
                    <li><a href="audio.html"><i class="fas fa-headphones"></i>Audio Biblia</a></li>
                    <li><a href="memorizados.html"><i class="fas fa-graduation-cap"></i>Versículos Memorizados</a></li>
                    <li><a href="historias.html"><i class="fas fa-book-open"></i>Historias Bíblicas</a></li>
                    <li><a href="diccionario.html"><i class="fas fa-book"></i>Diccionario</a></li>
                    <li><a href="bookmarks.html"><i class="fas fa-bookmark"></i>Versículos Guardados</a></li>
                    <li><a href="comments.html"><i class="fas fa-comment"></i>Notas</a></li>
                    <li><a href="topics.html"><i class="fas fa-tags"></i>Temas Bíblicos</a></li>
                    <li><a href="planes-estudio.html" class="highlighted-menu"><i class="fas fa-calendar-check"></i>Planes de Estudio <span class="new-badge">Nuevo</span></a></li>
                </ul>
            </div>
            <button class="menu-toggle" onclick="toggleMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <div id="overlay" class="overlay" onclick="toggleMenu()"></div>
        `;
        
        // Insertar el menú al principio del body
        document.body.insertAdjacentHTML('afterbegin', menuHTML);
        
        // Agregar estilos para el badge "Nuevo"
        const style = document.createElement('style');
        style.textContent = `
            .highlighted-menu {
                position: relative;
                color: #4CAF50 !important;
                font-weight: bold;
            }
            .new-badge {
                background: #ff5722;
                color: white;
                font-size: 0.7em;
                padding: 2px 6px;
                border-radius: 10px;
                margin-left: 8px;
                font-weight: normal;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.side-menu a').forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu();
        });
    });
    
    // Cerrar menú con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sideMenu = document.getElementById('side-menu');
            if (sideMenu && sideMenu.classList.contains('active')) {
                toggleMenu();
            }
        }
    });
}

// Inicializar el menú cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
} else {
    initMenu();
}
