document.addEventListener('DOMContentLoaded', () => {
    // Ensure HTML elements exist before adding event listeners
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchQuery');
    const randomButton = document.getElementById('rnd');
    
    if (searchButton) {
        searchButton.addEventListener('click', () => performSearch());
    }
    
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (randomButton) {
        randomButton.addEventListener('click', () => fetchRandomAnime());
    }
});

async function performSearch(query) {
    if (!query) {
        query = document.getElementById('searchQuery').value.trim();
        if (!query) {
            alert('Please enter a search query.');
            return;
        }
    }

    const url = `https://mangaverse-api1.p.rapidapi.com/search?query=${encodeURIComponent(query)}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '78e50baf37msh0ab8fa8b6754ce9p1e2a97jsnd39a2bc974ba',
            'x-rapidapi-host': 'mangaverse-api1.p.rapidapi.com'
        }
    };

    await handleApiCall(url, options, (result) => {
        console.log('Search Result:', result);
        displayResults(result, query);
    });
}

async function fetchRandomAnime() {
    const itemsPerPage = 15; // Number of items per page
    const totalItems = 6028; // Total number of items to consider
    const totalPages = Math.ceil(totalItems / itemsPerPage); // Calculate total number of pages

    const randomPage = Math.floor(Math.random() * totalPages) + 1; // Choose a random page number

    const url = `https://mangaverse-api1.p.rapidapi.com/search?query=all&page=${randomPage}&size=${itemsPerPage}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '78e50baf37msh0ab8fa8b6754ce9p1e2a97jsnd39a2bc974ba',
            'x-rapidapi-host': 'mangaverse-api1.p.rapidapi.com'
        }
    };

    await handleApiCall(url, options, (result) => {
        console.log('Raw API Result:', result); // Log the raw result

        if (Array.isArray(result) && result.length > 0) {
            const validResults = result.filter(manga => manga.url && manga.image_url && manga.image_url.startsWith('http'));

            console.log('Valid Results:', validResults); // Log filtered results

            if (validResults.length > 0) {
                const randomIndex = Math.floor(Math.random() * validResults.length);
                const randomAnime = validResults[randomIndex];

                displayResults([randomAnime], randomAnime.name);
            } else {
                alert('No valid anime found.');
            }
        } else {
            alert('No anime found.');
        }
    });
}

async function handleApiCall(url, options, onSuccess) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            console.log('Fetching data from:', url);
            const response = await fetch(url, options);
            console.log('Response status:', response.status);
            
            if (response.status === 429) {
                console.log('Rate limit exceeded, retrying...');
                attempt++;
                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Response result:', result);

            onSuccess(result);
            return;
        } catch (error) {
            console.error('An error occurred while fetching data:', error);
            alert('An error occurred while fetching data. Check console for details.');
            attempt++;
            if (attempt >= maxRetries) {
                console.error('Max retries reached.');
                break;
            }
        }
    }
}

function displayResults(data, query) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data && Array.isArray(data) && data.length > 0) {
        const filteredData = data.filter(manga => manga.name.toLowerCase().includes(query.toLowerCase()));

        if (filteredData.length > 0) {
            filteredData.forEach(manga => {
                const mangaItem = document.createElement('div');
                mangaItem.className = 'result-item';
                mangaItem.innerHTML = `
                    <h3>${manga.name}</h3>
                    <p>${manga.payload ? manga.payload.published : 'No synopsis available'}</p>
                    <img src="${manga.image_url}" alt="${manga.name}" style="width: 100px; height: auto;">
                    <p><a href="${manga.url}" target="_blank">More Info</a></p>
                `;
                resultsDiv.appendChild(mangaItem);
            });
        } else {
            const closestMatch = getClosestMatch(query, data);
            if (closestMatch) {
                const suggestion = document.createElement('p');
                suggestion.innerHTML = `<p>No results found for "${query}". Did you mean "<strong>${closestMatch.name}</strong>"?</p>`;
                suggestion.style.cursor = 'pointer';
                suggestion.addEventListener('click', () => {
                    document.getElementById('searchQuery').value = closestMatch.name;
                    performSearch(closestMatch.name);
                });
                resultsDiv.appendChild(suggestion);
            } else {
                resultsDiv.innerHTML = `<p>No results found for "${query}".</p>`;
            }
        }
    } else {
        resultsDiv.innerHTML = '<p>No results found.</p>';
    }
}

function getClosestMatch(query, data) {
    let closestMatch = null;
    let minDistance = Infinity;

    data.forEach(manga => {
        const distance = getLevenshteinDistance(query.toLowerCase(), manga.name.toLowerCase());
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = manga;
        }
    });

    if (minDistance > 6) return null;

    return closestMatch;
}

function getLevenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

document.addEventListener('DOMContentLoaded', () => {
    const randomButton = document.getElementById('rnd');

    if (randomButton) {
        randomButton.addEventListener('mouseover', () => {
            randomButton.style.animationPlayState = 'running'; // Start animation
        });

        randomButton.addEventListener('mouseout', () => {
            randomButton.style.animationPlayState = 'paused'; // Pause animation
        });
    }
});
