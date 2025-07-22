const API_KEY = '78e50baf37msh0ab8fa8b6754ce9p1e2a97jsnd39a2bc974ba';
const API_HOST = 'mangaverse-api1.p.rapidapi.com';

const searchInput = document.getElementById('searchQuery');
const searchBtn = document.getElementById('searchButton');
const refreshBtn = document.querySelector('.refresh');
const randomBtn = document.querySelector('.rnd');
const resultsContainer = document.getElementById('results');

// Render results
function renderResults(animeList) {
    resultsContainer.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }
    animeList.forEach(anime => {
        const title = anime.name || 'No title';
        const thumb = anime.thumbnail_url || anime.image_url || '';
        // No summary in the API response, so you can show published dates or score instead:
        const published = anime.payload?.published || 'No publish date info';
        const score = anime.payload?.score || 'No score info';
        const url = anime.url || '#';

        const card = document.createElement('div');
        card.className = 'result-item';
        card.innerHTML = `
            <h3>${title}</h3>
            <img src="${thumb}" alt="${title}" />
            <p>Published: ${published}</p>
            <p>Score: ${score}</p>
            <a href="${url}" target="_blank" rel="noopener noreferrer">Read More</a>
        `;
        resultsContainer.appendChild(card);
    });
}

// Levenshtein distance for typo suggestion
function getClosestMatch(query, list) {
    function levenshtein(a, b) {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + 1
                    );
                }
            }
        }
        return matrix[a.length][b.length];
    }
    let minDist = Infinity;
    let closest = null;
    list.forEach(item => {
        const dist = levenshtein(query.toLowerCase(), item.title.toLowerCase());
        if (dist < minDist) {
            minDist = dist;
            closest = item;
        }
    });
    return closest && minDist <= 3 ? closest : null; // Only suggest if typo is close
}

// Fetch manga from new API endpoint
async function fetchManga(query) {
    const url = `https://mangaverse-api1.p.rapidapi.com/search?query=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST,
            },
        });
        const json = await response.json();
        // The new API returns an array directly or under a property, adjust as needed
        // If the response is a string, try to parse it
        if (typeof json === 'string') {
            try {
                return JSON.parse(json);
            } catch {
                return [];
            }
        }
        // If the response is an object with a 'results' or 'data' property, use that
        if (Array.isArray(json)) return json;
        if (Array.isArray(json.results)) return json.results;
        if (Array.isArray(json.data)) return json.data;
        return [];
    } catch (err) {
        console.error('Fetch error:', err);
        return [];
    }
}

// Handle search and typo suggestion
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    resultsContainer.innerHTML = '<p>Loading...</p>';
    const results = await fetchManga(query);
    if (results.length > 0) {
        renderResults(results);
    } else {
        // Try to get close match from a generic search
        const genericResults = await fetchManga(''); // Get a list to compare
        const suggestion = getClosestMatch(query, genericResults);
        if (suggestion) {
            resultsContainer.innerHTML = `<p>No results found. Did you mean <a href="#" id="typo-suggestion">${suggestion.title}</a>?</p>`;
            document.getElementById('typo-suggestion').onclick = () => {
                searchInput.value = suggestion.title;
                handleSearch();
            };
        } else {
            resultsContainer.innerHTML = '<p>No results found.</p>';
        }
    }
}

// Refresh page
function refreshPage() {
    searchInput.value = '';
    resultsContainer.innerHTML = '';
}

// Show random manga
async function showRandom() {
    const results = await fetchManga('a');
    const valid = results.filter(a =>
        (a.thumbnail_url || a.image_url) && a.name
    );

    if (!valid.length) {
        resultsContainer.innerHTML = '<p>No valid manga to display.</p>';
        return;
    }
    const random = valid[Math.floor(Math.random() * valid.length)];
    renderResults([random]);
}

// Event listeners
searchBtn.addEventListener('click', handleSearch);
refreshBtn.addEventListener('click', refreshPage);
randomBtn?.addEventListener('click', showRandom);
searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
});