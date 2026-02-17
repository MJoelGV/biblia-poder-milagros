# Ruta base del proyecto
$basePath = ".\docs"

# Crear directorios necesarios si no existen
$cssDir = "$basePath\css"
$jsDir = "$basePath\js"

if (-not (Test-Path $cssDir)) { New-Item -ItemType Directory -Path $cssDir | Out-Null }
if (-not (Test-Path $jsDir)) { New-Item -ItemType Directory -Path $jsDir | Out-Null }

# Definir la estructura del menú
$menuHTML = @"
    <!-- Menú lateral -->
    <div id="side-menu" class="side-menu">
        <div class="menu-header">
            <button class="close-menu" onclick="toggleMenu()">&times;</button>
        </div>
        <ul>
            <li><a href="index.html"><i class="fas fa-home"></i> Página principal</a></li>
            <li><a href="lectura.html"><i class="fas fa-book"></i> Leer Biblia</a></li>
            <li><a href="pericopas-standalone.html"><i class="fas fa-list"></i> Perícopas Bíblicas</a></li>
            <li><a href="audio.html"><i class="fas fa-headphones"></i> Audio Biblia</a></li>
            <li><a href="memorizados.html"><i class="fas fa-graduation-cap"></i> Versículos Memorizados</a></li>
            <li><a href="historias.html"><i class="fas fa-book-open"></i> Historias Bíblicas</a></li>
            <li><a href="diccionario.html"><i class="fas fa-book"></i> Diccionario Bíblico</a></li>
            <li><a href="bookmarks.html"><i class="fas fa-bookmark"></i> Versículos Guardados</a></li>
            <li><a href="comments.html"><i class="fas fa-comment"></i> Notas y Comentarios</a></li>
            <li><a href="temas.html"><i class="fas fa-tags"></i> Temas Bíblicos</a></li>
            <li><a href="planes-estudio.html" class="highlighted-menu"><i class="fas fa-calendar-check"></i> Planes de Estudio <span class="new-badge">¡Nuevo!</span></a></li>
        </ul>
    </div>
    <button class="menu-toggle" onclick="toggleMenu()">
        <i class="fas fa-bars"></i>
    </button>
    <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
"@

# Definir el código JavaScript para el menú
$menuJS = @"
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

// Cerrar menú con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu && sideMenu.classList.contains('active')) {
            toggleMenu();
        }
    }
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.side-menu a').forEach(link => {
    link.addEventListener('click', () => {
        toggleMenu();
    });
});
"@

# Obtener todos los archivos HTML
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html" -File -Recurse

# Actualizar cada archivo HTML
foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $updated = $false
        
        # Verificar si el archivo ya tiene un menú
        if ($content -match 'id=["'']side-menu["'']') {
            Write-Host "Actualizando menú en: $($file.Name)"
            
            # Reemplazar el menú existente
            $content = $content -replace '(?s)<!-- Menú lateral -->.*?<div class=["'']overlay["''][^>]*>', "`$1$menuHTML    <div class='overlay'"
            
            # Asegurarse de que el script del menú esté presente
            if ($content -notmatch 'function\s+toggleMenu\s*\(') {
                $content = $content -replace '(?s)(</body>)', "<script>$menuJS</script>`n`$1"
            }
            
            # Asegurarse de que el CSS del menú esté incluido
            if ($content -notmatch 'menu-styles\.css') {
                $content = $content -replace '(?s)(</head>)', "    <link rel='stylesheet' href='css/menu-styles.css'>`n`$1"
            }
            
            # Asegurarse de que Font Awesome esté incluido
            if ($content -notmatch 'font-awesome') {
                $content = $content -replace '(?s)(</head>)', "    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'>`n`$1"
            }
            
            # Guardar los cambios
            $content | Set-Content -Path $file.FullName -NoNewline -Encoding UTF8
            $updated = $true
        }
        
        if ($updated) {
            Write-Host "  ✓ Actualizado correctamente" -ForegroundColor Green
        } else {
            Write-Host "  - Sin cambios (no tiene menú o ya está actualizado)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  ✗ Error al procesar el archivo: $_" -ForegroundColor Red
    }
}

Write-Host "`n¡Proceso completado!" -ForegroundColor Green
