const apiKey = 'f6450ebcd6924ffc380648dcf77b28fb';

async function fetchUpcomingMovies() {
    const response = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=en-US&page=1`);
    const data = await response.json();
    return data.results;
}

async function displayUpcomingMovies() {
    const movies = await fetchUpcomingMovies();
    const moviesContainer = document.getElementById('movies');
    movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.className = 'col-md-4 mb-4';
        movieElement.innerHTML = `<div class="card h-100">
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="card-img-top" alt="${movie.title}">
            <div class="card-body">
                <h5 class="card-title">${movie.title}</h5>
                <p class="card-text">Release Date: ${movie.release_date}</p>
            </div>
            <div class="card-footer">
                <small class="text-muted">Last updated 3 mins ago</small>
            </div>
        </div>`;
        moviesContainer.appendChild(movieElement);
    });
}

document.addEventListener('DOMContentLoaded', displayUpcomingMovies);
