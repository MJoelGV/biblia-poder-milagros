# Ruta base del proyecto
$basePath = ".\docs"

# Obtener todos los archivos HTML
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html" -File

# Definir la estructura del menú actualizado
$newMenu = @'
    <!-- Menú lateral -->
    <div id="side-menu" class="side-menu">
        <ul>
            <li onclick="window.location.href='index.html'"><i class="fas fa-home"></i>Página principal</li>
            <li onclick="window.location.href='lectura.html'"><i class="fas fa-bible"></i>Leer Biblia</li>
            <li onclick="window.location.href='pericopas-standalone.html'"><i class="fas fa-book-reader"></i>Perícopas Bíblicas</li>
            <li onclick="window.location.href='audio.html'"><i class="fas fa-headphones"></i>Audio Biblia</li>
            <li onclick="window.location.href='memorizados.html'"><i class="fas fa-graduation-cap"></i>Versículos Memorizados</li>
            <li onclick="window.location.href='historias.html'"><i class="fas fa-book-open"></i>Historias Bíblicas</li>
            <li onclick="window.location.href='diccionario.html'"><i class="fas fa-book"></i>Diccionario Bíblico</li>
            <li onclick="window.location.href='bookmarks.html'"><i class="fas fa-bookmark"></i>Versículos Guardados</li>
            <li onclick="window.location.href='comments.html'"><i class="fas fa-comment"></i>Notas y Comentarios</li>
            <li onclick="window.location.href='temas.html'"><i class="fas fa-tags"></i>Temas Bíblicos</li>
            <li onclick="window.location.href='planes-estudio.html'" class="highlighted"><i class="fas fa-calendar-check"></i>Planes de Estudio <span class="new-badge">¡Nuevo!</span></li>
        </ul>
    </div>
    <button id="menu-toggle" class="menu-toggle">
        <i class="fas fa-bars"></i>
    </button>
    <div id="overlay" class="overlay"></div>
'@

# Actualizar cada archivo HTML
foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Reemplazar el menú existente con el nuevo
    $updatedContent = $content -replace '(?s)<!-- Menú lateral -->.*?<div class="background"></div>', $newMenu
    
    # Actualizar el archivo si hubo cambios
    if ($updatedContent -ne $content) {
        $updatedContent | Set-Content -Path $file.FullName -NoNewline
        Write-Host "Actualizado: $($file.Name)"
    }
}

Write-Host "¡Proceso completado! Todos los menús han sido actualizados."
