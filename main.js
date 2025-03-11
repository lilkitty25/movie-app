const apiKey = 'f6450ebcd6924ffc380648dcf77b28fb';
let allMovies = []; // Variable global para almacenar todas las películas

async function fetchMoviesFromEndpoint(endpoint, pages = 3) {
    let allResults = [];
    
    try {
        // Obtener el número de páginas disponibles (máximo establecido por el parámetro pages)
        for (let page = 1; page <= pages; page++) {
            console.log(`Obteniendo ${endpoint} - página ${page}...`);
            const response = await fetch(`https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=es-ES&page=${page}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            allResults = [...allResults, ...data.results];
            
            // Si no hay más páginas, salir del bucle
            if (page >= data.total_pages || page >= pages) {
                break;
            }
        }
        
        return allResults;
    } catch (error) {
        console.error(`Error al obtener películas de ${endpoint}:`, error);
        return [];
    }
}

async function fetchUpcomingMovies() {
    return await fetchMoviesFromEndpoint('upcoming');
}

async function fetchPopularMovies() {
    return await fetchMoviesFromEndpoint('popular');
}

async function fetchTopRatedMovies() {
    return await fetchMoviesFromEndpoint('top_rated');
}

async function fetchNowPlayingMovies() {
    return await fetchMoviesFromEndpoint('now_playing');
}

// Función para combinar películas de múltiples fuentes y eliminar duplicados
async function fetchAllMovies() {
    try {
        console.log('Obteniendo películas de múltiples categorías...');
        
        // Obtener películas de diferentes categorías en paralelo
        const [upcoming, popular, nowPlaying] = await Promise.all([
            fetchUpcomingMovies(),
            fetchPopularMovies(),
            fetchNowPlayingMovies()
        ]);
        
        console.log(`Películas obtenidas - Próximas: ${upcoming.length}, Populares: ${popular.length}, En cartelera: ${nowPlaying.length}`);
        
        // Combinar todas las películas y eliminar duplicados por ID
        const combinedMovies = [...upcoming, ...popular, ...nowPlaying];
        const uniqueMovies = Array.from(
            combinedMovies.reduce((map, movie) => map.set(movie.id, movie), new Map()).values()
        );
        
        console.log(`Total de películas únicas: ${uniqueMovies.length}`);
        return uniqueMovies;
    } catch (error) {
        console.error('Error al obtener todas las películas:', error);
        return [];
    }
}

// Función para obtener fecha actual en formato YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Función para obtener el primer día del mes actual
function getFirstDayOfMonth() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
}

// Función para obtener el primer día del próximo mes
function getFirstDayOfNextMonth() {
    const today = new Date();
    let nextMonth = today.getMonth() + 2; // +1 para el próximo mes, +1 porque los meses son 0-indexed
    let year = today.getFullYear();
    
    if (nextMonth > 12) {
        nextMonth = 1;
        year++;
    }
    
    return `${year}-${String(nextMonth).padStart(2, '0')}-01`;
}

// Función para obtener el primer día del próximo año
function getFirstDayOfNextYear() {
    const today = new Date();
    return `${today.getFullYear() + 1}-01-01`;
}

// Función para obtener el primer día del año actual
function getFirstDayOfThisYear() {
    const today = new Date();
    return `${today.getFullYear()}-01-01`;
}

// Función para aplicar los filtros a las películas
function applyFilters(movies) {
    const titleFilter = document.getElementById('search-title').value.toLowerCase();
    const dateFilterValue = document.getElementById('release-date-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    // Filtramos por título
    let filteredMovies = movies.filter(movie => {
        return movie.title.toLowerCase().includes(titleFilter);
    });
    
    // Filtramos por fecha según el valor seleccionado
    if (dateFilterValue) {
        const today = getTodayDate();
        
        switch(dateFilterValue) {
            case 'upcoming':
                // Películas que se estrenan desde hoy en adelante
                filteredMovies = filteredMovies.filter(movie => {
                    return movie.release_date >= today;
                });
                break;
            case 'this-month':
                // Películas que se estrenan este mes
                const firstDayOfMonth = getFirstDayOfMonth();
                const firstDayOfNextMonth = getFirstDayOfNextMonth();
                filteredMovies = filteredMovies.filter(movie => {
                    return movie.release_date >= firstDayOfMonth && movie.release_date < firstDayOfNextMonth;
                });
                break;
            case 'next-month':
                // Películas que se estrenan el próximo mes
                const firstDayNextMonth = getFirstDayOfNextMonth();
                const firstDayOfMonthAfterNext = new Date(firstDayNextMonth);
                firstDayOfMonthAfterNext.setMonth(firstDayOfMonthAfterNext.getMonth() + 1);
                const nextMonthLimit = firstDayOfMonthAfterNext.toISOString().split('T')[0];
                
                filteredMovies = filteredMovies.filter(movie => {
                    return movie.release_date >= firstDayNextMonth && movie.release_date < nextMonthLimit;
                });
                break;
            case 'this-year':
                // Películas que se estrenan este año
                const firstDayOfYear = getFirstDayOfThisYear();
                const firstDayOfNextYear = getFirstDayOfNextYear();
                filteredMovies = filteredMovies.filter(movie => {
                    return movie.release_date >= firstDayOfYear && movie.release_date < firstDayOfNextYear;
                });
                break;
        }
    }
    
    // Ordenamos según el criterio seleccionado
    switch(sortBy) {
        case 'date-asc':
            filteredMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
            break;
        case 'date-desc':
            filteredMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
            break;
        case 'title-asc':
            filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredMovies.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'rating-desc':
            // Ordenar por puntuación (de mayor a menor)
            filteredMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
        case 'rating-asc':
            // Ordenar por puntuación (de menor a mayor)
            filteredMovies.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
            break;
    }
    
    // Actualizamos el contador de resultados
    const resultsCount = document.getElementById('results-count');
    if (filteredMovies.length === 0) {
        resultsCount.textContent = 'No se encontraron películas con los filtros seleccionados';
        resultsCount.className = 'alert alert-warning mb-3';
    } else if (filteredMovies.length === movies.length) {
        resultsCount.textContent = 'Mostrando todas las películas';
        resultsCount.className = 'alert alert-info mb-3';
    } else {
        resultsCount.textContent = `Mostrando ${filteredMovies.length} de ${movies.length} películas`;
        resultsCount.className = 'alert alert-success mb-3';
    }
    
    return filteredMovies;
}

// Función para renderizar las películas en el DOM
function renderMovies(movies) {
    const moviesContainer = document.getElementById('movies');
    moviesContainer.innerHTML = ''; // Limpiamos el contenedor
    
    movies.forEach(movie => {
        // Comprobar si la película tiene una imagen de cartel válida
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : '/public/no-poster.svg'; // Imagen de respaldo SVG
        
        // Limitar la descripción a un máximo de caracteres para mejor visualización
        const overview = movie.overview 
            ? (movie.overview.length > 150 ? movie.overview.substring(0, 150) + '...' : movie.overview)
            : 'No hay descripción disponible';
            
        // Generar las estrellas de calificación
        const rating = movie.vote_average || 0;
        const starRating = generateStarRating(rating);
        
        const movieElement = document.createElement('div');
        movieElement.className = 'col-md-4 mb-4';
        movieElement.innerHTML = `<div class="card h-100">
            <div class="image-container">
                <span class="rating-badge">${rating.toFixed(1)}</span>
                <img src="${posterUrl}" class="card-img-top" alt="${movie.title}" 
                     onerror="this.onerror=null; this.src='/public/no-poster.svg';">
                <div class="overlay">
                    <p class="card-text">${overview}</p>
                </div>
            </div>
            <div class="card-body">
                <h5 class="card-title">${movie.title}</h5>
                <div class="rating-container">
                    <div class="rating-stars">
                        ${starRating}
                    </div>
                </div>
                <h6 class="card-subtitle text-muted">Fecha de Estreno: ${movie.release_date || 'Sin fecha'}</h6>
                <a href="https://www.themoviedb.org/movie/${movie.id}" class="btn btn-danger mt-auto" target="_blank">Ver Más Info</a>
            </div>
        </div>`;

        moviesContainer.appendChild(movieElement);
    });
}

// Función para generar las estrellas de calificación
function generateStarRating(rating) {
    // Convertir la calificación de 0-10 a 0-5
    const normalizedRating = rating / 2;
    let stars = '';
    
    // Generar 5 estrellas
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(normalizedRating)) {
            // Estrella completa
            stars += '<span class="star filled">★</span>';
        } else {
            // Estrella vacía
            stars += '<span class="star">★</span>';
        }
    }
    
    return stars;
}

// Inicialización: cargar películas y configurar eventos
async function initializeApp() {
    try {
        console.log('Inicializando aplicación...');
        // Cargamos todas las películas
        allMovies = await fetchAllMovies();
        console.log('Películas cargadas:', allMovies.length);
    
        // Mostramos todas las películas inicialmente
        renderMovies(allMovies);
    
        // Configuramos el evento para aplicar filtros manualmente si existe el botón
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                console.log('Aplicando filtros manualmente');
                const filteredMovies = applyFilters(allMovies);
                renderMovies(filteredMovies);
            });
        }
    
        // Configuramos el evento para limpiar filtros
        document.getElementById('clear-filters').addEventListener('click', () => {
            console.log('Limpiando todos los filtros');
            // Reiniciamos los valores de los filtros
            document.getElementById('search-title').value = '';
            document.getElementById('release-date-filter').value = '';
            document.getElementById('sort-by').value = 'date-asc';
            document.getElementById('date-filter-btn').textContent = 'Seleccionar filtro de fecha';
            document.getElementById('sort-by-btn').textContent = 'Fecha (Más próxima)';
        
            // Mostramos todas las películas nuevamente
            renderMovies(allMovies);
        
            // Actualizamos el contador de resultados
            const resultsCount = document.getElementById('results-count');
            resultsCount.textContent = 'Mostrando todas las películas';
            resultsCount.className = 'alert alert-info mb-3';
            
            // Depurar estado después de limpiar
            debugFilters();
        });
        
        // Añadir eventos para filtrado por texto (título)
        document.getElementById('search-title').addEventListener('input', () => {
            console.log('Filtrando por título');
            const filteredMovies = applyFilters(allMovies);
            renderMovies(filteredMovies);
        });
        
        // Configuramos los eventos para el nuevo dropdown de ordenación
        const sortDropdownItems = document.querySelectorAll('#sort-dropdown-menu .dropdown-item');
        const sortByBtn = document.getElementById('sort-by-btn');
        const sortByInput = document.getElementById('sort-by');
        const sortDropdownMenu = document.getElementById('sort-dropdown-menu');
        
        console.log('Estado de los elementos del dropdown de ordenación:');
        console.log('- Items encontrados:', sortDropdownItems.length);
        console.log('- Botón ordenación:', sortByBtn ? 'OK' : 'No encontrado');
        console.log('- Input escondido:', sortByInput ? 'OK' : 'No encontrado');
        console.log('- Contenedor dropdown:', sortDropdownMenu ? 'OK' : 'No encontrado');
        
        // Toggle para el dropdown de ordenación (sin overlay)
        sortByBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = sortDropdownMenu.style.display === 'block';
            
            if (!isVisible) {
                // Asegurarse que el dropdown esté dentro del contenedor correcto
                const sortContainer = document.querySelector('.custom-sort-dropdown');
                if (sortContainer && !sortContainer.contains(sortDropdownMenu)) {
                    sortContainer.appendChild(sortDropdownMenu);
                }
                
                // Mostrar el dropdown debajo del botón
                sortDropdownMenu.style.display = 'block';
                
                // Forzar un reflow para asegurar que se apliquen las animaciones
                void sortDropdownMenu.offsetWidth;
            } else {
                // Ocultar el dropdown
                sortDropdownMenu.style.display = 'none';
            }
        });
        
        // Eventos para los items del dropdown de ordenación
        sortDropdownItems.forEach(item => {
            const value = item.getAttribute('data-value');
            console.log('Registrando evento para opción de ordenación:', item.textContent.trim(), 'con valor:', value);
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = e.target.getAttribute('data-value');
                sortByInput.value = value;
                
                console.log('Aplicando ordenación:', value); // Para depuración
                
                // Actualizar el texto del botón según la opción seleccionada
                sortByBtn.textContent = e.target.textContent.trim();
                
                // Cerrar el dropdown
                sortDropdownMenu.style.display = 'none';
                
                // Aplicar filtros inmediatamente para una mejor experiencia de usuario
                const filteredMovies = applyFilters(allMovies);
                renderMovies(filteredMovies);
            });
        });
        // Configuramos los eventos para el nuevo filtro de fecha por dropdown personalizado
        const dateFilterDropdownItems = document.querySelectorAll('#date-dropdown-menu .dropdown-item');
        const dateFilterBtn = document.getElementById('date-filter-btn');
        const dateFilterInput = document.getElementById('release-date-filter');
        const dropdownMenu = document.getElementById('date-dropdown-menu');
        
        console.log('Estado de los elementos del dropdown:');
        console.log('- Items encontrados:', dateFilterDropdownItems.length);
        console.log('- Botón filtro:', dateFilterBtn ? 'OK' : 'No encontrado');
        console.log('- Input escondido:', dateFilterInput ? 'OK' : 'No encontrado');
        console.log('- Contenedor dropdown:', dropdownMenu ? 'OK' : 'No encontrado');
        
        // Toggle para el modal de filtro de fecha
        dateFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdownMenu.style.display === 'block';
            
            if (!isVisible) {
                // Asegurarse que el dropdown esté dentro del contenedor correcto
                const dateContainer = document.querySelector('.custom-date-dropdown');
                if (dateContainer && !dateContainer.contains(dropdownMenu)) {
                    dateContainer.appendChild(dropdownMenu);
                }
                
                // Mostrar el overlay de fondo
                const overlay = document.querySelector('.dropdown-overlay') || createModalOverlay();
                overlay.style.display = 'block';
                
                // Mostrar el dropdown
                dropdownMenu.style.display = 'block';
                
                // Forzar un reflow para asegurar que se apliquen las animaciones
                void dropdownMenu.offsetWidth;
            } else {
                // Ocultar el dropdown y el overlay
                dropdownMenu.style.display = 'none';
                const overlay = document.querySelector('.dropdown-overlay');
                if (overlay) overlay.style.display = 'none';
            }
        });
    
        // Cerrar los dropdowns al presionar la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Cerrar modal de fecha si está abierto y ocultar su overlay
                if (dropdownMenu.style.display === 'block') {
                    dropdownMenu.style.display = 'none';
                    const overlay = document.querySelector('.dropdown-overlay');
                    if (overlay) overlay.style.display = 'none';
                }
                
                // Cerrar dropdown de ordenación si está abierto (sin overlay)
                if (sortDropdownMenu && sortDropdownMenu.style.display === 'block') {
                    sortDropdownMenu.style.display = 'none';
                }
            }
        });
        
        // Cerrar los dropdowns al hacer clic fuera de ellos
        document.addEventListener('click', (e) => {
            // Verificar si el dropdown de ordenación está visible
            if (sortDropdownMenu && sortDropdownMenu.style.display === 'block') {
                // Si el clic es fuera del dropdown y no es en el botón que lo abre
                if (!sortDropdownMenu.contains(e.target) && e.target !== sortByBtn) {
                    // Ocultar el dropdown
                    sortDropdownMenu.style.display = 'none';
                }
            }
            
            // Verificar si el dropdown de fecha está visible
            if (dropdownMenu.style.display === 'block') {
                // Si el clic es fuera del dropdown y no es en el botón que lo abre
                if (!dropdownMenu.contains(e.target) && e.target !== dateFilterBtn) {
                    // Ocultar el dropdown y el overlay
                    dropdownMenu.style.display = 'none';
                    const overlay = document.querySelector('.dropdown-overlay');
                    if (overlay) overlay.style.display = 'none';
                }
            }
        });
    
        // Eventos para los items del dropdown
        dateFilterDropdownItems.forEach(item => {
            const value = item.getAttribute('data-value');
            console.log('Registrando evento para opción:', item.textContent.trim(), 'con valor:', value);
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = e.target.getAttribute('data-value');
                dateFilterInput.value = value;
                
                console.log('Aplicando filtro de fecha:', value); // Para depuración
            
                // Actualizar el texto del botón según la opción seleccionada
                switch(value) {
                    case '':
                        dateFilterBtn.textContent = 'Todas las fechas';
                        break;
                    case 'upcoming':
                        dateFilterBtn.textContent = 'Próximos estrenos';
                        break;
                    case 'this-month':
                        dateFilterBtn.textContent = 'Este mes';
                        break;
                    case 'next-month':
                        dateFilterBtn.textContent = 'Mes siguiente';
                        break;
                    case 'this-year':
                        dateFilterBtn.textContent = 'Este año';
                        break;
                }
            
                // Cerrar el modal y el overlay
                dropdownMenu.style.display = 'none';
                const overlay = document.querySelector('.dropdown-overlay');
                if (overlay) overlay.style.display = 'none';
                
                // Aplicar filtros inmediatamente para una mejor experiencia de usuario
                const filteredMovies = applyFilters(allMovies);
                renderMovies(filteredMovies);
                
                // Scroll suave hasta la sección de resultados
                document.getElementById('results-count').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
    });
    
        // Verificar filtros activos al inicializar
        debugFilters();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
}

// Función para crear un overlay de fondo para el modal
function createModalOverlay() {
    // Verificar si ya existe el overlay
    let overlay = document.querySelector('.dropdown-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dropdown-overlay';
        document.body.appendChild(overlay);
        
        // Añadir evento de click para cerrar el modal al hacer clic en el overlay
        overlay.addEventListener('click', () => {
            const dropdownMenu = document.getElementById('date-dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = 'none';
                overlay.style.display = 'none';
            }
        });
    }
    return overlay;
}

// Función para depurar estado de filtros
function debugFilters() {
    console.log('Estado actual de filtros:');
    console.log('Título:', document.getElementById('search-title').value);
    console.log('Fecha:', document.getElementById('release-date-filter').value);
    console.log('Orden:', document.getElementById('sort-by').value);
    console.log('Texto botón fecha:', document.getElementById('date-filter-btn').textContent);
    console.log('Texto botón orden:', document.getElementById('sort-by-btn').textContent);
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Ejecutar depuración al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Verificando elementos DOM después de carga:');
        console.log('- Dropdown fecha items:', document.querySelectorAll('#date-dropdown-menu .dropdown-item').length);
        console.log('- Dropdown orden items:', document.querySelectorAll('#sort-dropdown-menu .dropdown-item').length);
        console.log('- Release date input:', document.getElementById('release-date-filter') ? 'Encontrado' : 'No encontrado');
        console.log('- Sort by input:', document.getElementById('sort-by') ? 'Encontrado' : 'No encontrado');
        debugFilters();
    }, 1000); // Esperar 1 segundo para asegurar que todo está cargado
});

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeIconLight = document.querySelector('.theme-icon-light');
    const themeIconDark = document.querySelector('.theme-icon-dark');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Toggle Bootstrap classes for consistent styling
    body.classList.toggle('bg-dark', isDarkMode);
    body.classList.toggle('bg-light', !isDarkMode);
    body.classList.toggle('text-white', isDarkMode);
    body.classList.toggle('text-dark', !isDarkMode);
    
    // Toggle elements with dark-mode class
    document.querySelector('.container').classList.toggle('dark-mode', isDarkMode);
    document.querySelectorAll('.card').forEach(card => {
        card.classList.toggle('dark-mode', isDarkMode);
    });
    
    // Añadir efecto visual al botón
    themeToggleBtn.classList.add('theme-toggle-active');
    setTimeout(() => {
        themeToggleBtn.classList.remove('theme-toggle-active');
    }, 700);
    
    // Animación para los iconos
    if (isDarkMode) {
        // Animar la salida del icono de sol y la entrada del icono de luna
        themeIconLight.classList.add('theme-icon-animate-out');
        setTimeout(() => {
            themeIconLight.style.display = 'none';
            themeIconDark.style.display = 'block';
            themeIconDark.classList.add('theme-icon-animate-in');
            // Limpiar clases de animación después de que se complete
            setTimeout(() => {
                themeIconDark.classList.remove('theme-icon-animate-in');
            }, 500);
        }, 450); // Un poco antes de que termine la animación de salida
    } else {
        // Animar la salida del icono de luna y la entrada del icono de sol
        themeIconDark.classList.add('theme-icon-animate-out');
        setTimeout(() => {
            themeIconDark.style.display = 'none';
            themeIconLight.style.display = 'block';
            themeIconLight.classList.add('theme-icon-animate-in');
            // Limpiar clases de animación después de que se complete
            setTimeout(() => {
                themeIconLight.classList.remove('theme-icon-animate-in');
            }, 500);
        }, 450); // Un poco antes de que termine la animación de salida
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
}

// Initialize theme based on saved preference or system preference
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIconLight = document.querySelector('.theme-icon-light');
    const themeIconDark = document.querySelector('.theme-icon-dark');
    
    // Check localStorage first
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    let isDarkMode = false;
    
    // If there's a saved theme preference, use that
    if (savedTheme !== null) {
        isDarkMode = savedTheme === 'true';
    } else {
        // Otherwise, respect system preference
        isDarkMode = prefersDarkScheme.matches;
    }
    
    // Apply initial theme
    const body = document.body;
    body.classList.toggle('dark-mode', isDarkMode);
    body.classList.toggle('bg-dark', isDarkMode);
    body.classList.toggle('bg-light', !isDarkMode);
    body.classList.toggle('text-white', isDarkMode);
    body.classList.toggle('text-dark', !isDarkMode);
    
    // Set container and cards
    document.querySelector('.container')?.classList.toggle('dark-mode', isDarkMode);
    document.querySelectorAll('.card').forEach(card => {
        card.classList.toggle('dark-mode', isDarkMode);
    });
    
    // Set initial icon state
    themeIconLight.style.display = isDarkMode ? 'none' : 'block';
    themeIconDark.style.display = isDarkMode ? 'block' : 'none';
    
    // Add click event listener
    themeToggleBtn.addEventListener('click', toggleTheme);
});
