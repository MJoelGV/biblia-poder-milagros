// search.js - Módulo de búsqueda para la aplicación de la Biblia

// Variables globales para la búsqueda
let searchTimeout = null;
let currentSearchTerm = '';
let searchResults = [];

// Elementos del DOM para la búsqueda
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResultsContainer = document.getElementById('search-results');
const searchResultsContent = document.getElementById('search-results-content');
const closeSearch = document.querySelector('.close-search');

// Inicializar eventos de búsqueda
function initSearch() {
    // Buscar al hacer clic en el botón de búsqueda
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleSearch);
        
        // Buscar al escribir (con debounce)
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const term = e.target.value.trim();
            
            if (term.length < 2) {
                if (searchResultsContainer) {
                    searchResultsContainer.classList.remove('active');
                }
                return;
            }
            
            // Usar setTimeout para debounce
            searchTimeout = setTimeout(() => {
                currentSearchTerm = term;
                performSearch(term);
            }, 300);
        });
        
        // Buscar al presionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                e.preventDefault();
                currentSearchTerm = searchInput.value.trim();
                performSearch(currentSearchTerm);
            }
        });
    }
    
    // Cerrar resultados de búsqueda
    if (closeSearch && searchResultsContainer) {
        closeSearch.addEventListener('click', () => {
            searchResultsContainer.classList.remove('active');
            if (searchInput) searchInput.value = '';
        });
    }
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (searchResultsContainer && 
            !searchResultsContainer.contains(e.target) && 
            e.target !== searchInput && 
            e.target !== searchButton) {
            searchResultsContainer.classList.remove('active');
        }
    });
}

// Función para manejar la búsqueda
function handleSearch() {
    const term = searchInput ? searchInput.value.trim() : '';
    if (!term) {
        if (searchResultsContainer) {
            searchResultsContainer.classList.remove('active');
        }
        return;
    }
    
    currentSearchTerm = term;
    performSearch(term);
}

// Función para escapar caracteres especiales en expresiones regulares
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función para realizar la búsqueda
async function performSearch(term) {
    if (!term || term.length < 2) return;
    
    // Mostrar indicador de carga
    if (searchResultsContent) {
        searchResultsContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Buscando "${term}" en la Biblia...</p>
            </div>`;
        
        // Mostrar el contenedor de resultados
        searchResultsContainer.classList.add('active');
    }
    
    try {
        // Simular carga (en una implementación real, aquí se buscaría en el texto bíblico)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // En una implementación real, aquí se buscaría en el texto bíblico
        // Por ahora, simulamos resultados vacíos
        const results = [];
        
        if (results.length === 0) {
            searchResultsContent.innerHTML = `
                <div class="no-results">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="11" y1="17" x2="11.01" y2="17"></line>
                    </svg>
                    <p>No se encontraron resultados para</p>
                    <p class="search-term">"${term}"</p>
                </div>`;
        } else {
            displaySearchResults(results, term);
        }
        
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        if (searchResultsContent) {
            searchResultsContent.innerHTML = `
                <div class="error">
                    <p>Ocurrió un error al realizar la búsqueda.</p>
                    <p>${error.message}</p>
                </div>`;
        }
    }
}

// Función para mostrar los resultados de la búsqueda
function displaySearchResults(results, searchTerm) {
    if (!searchResultsContent) return;
    
    // Ordenar resultados por libro, capítulo y versículo
    results.sort((a, b) => {
        // Primero por libro
        const bookCompare = a.book.localeCompare(b.book);
        if (bookCompare !== 0) return bookCompare;
        
        // Luego por capítulo
        const chapterA = parseInt(a.chapter, 10);
        const chapterB = parseInt(b.chapter, 10);
        if (chapterA !== chapterB) return chapterA - chapterB;
        
        // Finalmente por versículo
        return parseInt(a.verse, 10) - parseInt(b.verse, 10);
    });
    
    // Actualizar el array global de resultados
    searchResults = [...results];
    
    // Agrupar resultados por libro y capítulo para mejor organización
    const groupedResults = {};
    results.forEach(result => {
        const key = `${result.book}-${result.chapter}`;
        if (!groupedResults[key]) {
            groupedResults[key] = [];
        }
        groupedResults[key].push(result);
    });
    
    // Construir HTML de resultados
    let html = `
        <div class="search-summary">
            <p>Se encontraron <strong>${results.length} versículos</strong> con <strong>${results.reduce((sum, r) => sum + (r.matchCount || 1), 0)} coincidencias</strong> para:</p>
            <p class="search-term">"${searchTerm}"</p>
        </div>`;
    
    // Agregar resultados agrupados
    Object.entries(groupedResults).forEach(([group, groupResults]) => {
        const [book, chapter] = group.split('-');
        
        html += `
            <div class="result-group">
                <h3 class="group-header">${book} ${chapter}</h3>
                <div class="group-results">`;
        
        groupResults.forEach(result => {
            html += `
                    <div class="result-item" 
                         data-book="${result.book}" 
                         data-chapter="${result.chapter}" 
                         data-verse="${result.verse}">
                        <div class="verse-header">
                            <span class="verse-reference">${result.book} ${result.chapter}:${result.verse}</span>
                            <span class="match-count">${result.matchCount || 1} ${result.matchCount === 1 ? 'coincidencia' : 'coincidencias'}</span>
                        </div>
                        <div class="verse-text">${result.text}</div>
                    </div>`;
        });
        
        html += `
                </div>
            </div>`;
    });
    
    searchResultsContent.innerHTML = html;
    
    // Agregar eventos a los resultados
    attachResultItemEvents();
}

// Función para adjuntar eventos a los elementos de resultado
function attachResultItemEvents() {
    const resultItems = document.querySelectorAll('.result-item');
    
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const book = item.dataset.book;
            const chapter = parseInt(item.dataset.chapter);
            const verse = parseInt(item.dataset.verse);
            
            // Navegar al versículo
            navigateToVerse(book, chapter, verse);
            
            // Cerrar resultados después de un breve retraso para permitir la navegación
            setTimeout(() => {
                if (searchResultsContainer) {
                    searchResultsContainer.classList.remove('active');
                }
            }, 300);
        });
        
        // Efecto hover
        item.addEventListener('mouseenter', () => {
            const verse = parseInt(item.dataset.verse);
            // Resaltar el versículo en la vista previa
            const verseElement = document.querySelector(`.verse[data-verse="${verse}"]`);
            if (verseElement) {
                verseElement.classList.add('preview-highlight');
            }
        });
        
        item.addEventListener('mouseleave', () => {
            // Quitar el resaltado de la vista previa
            document.querySelectorAll('.preview-highlight').forEach(el => {
                el.classList.remove('preview-highlight');
            });
        });
    });
}

// Función auxiliar para navegar a un versículo específico
function navigateToVerse(book, chapter, verse) {
    // Esta función debería ser implementada en el archivo principal
    // para manejar la navegación a un versículo específico
    if (typeof window.navigateToVerse === 'function') {
        window.navigateToVerse(book, chapter, verse);
    } else {
        console.log(`Navegando a ${book} ${chapter}:${verse}`);
    }
}

// Inicializar la búsqueda cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

// Exportar funciones para uso global
window.searchModule = {
    initSearch,
    performSearch,
    displaySearchResults
};
