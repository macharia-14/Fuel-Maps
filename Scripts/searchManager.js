/* Search Manager- Handles search functionality for petrol stations */

const SearchManager = {
    isSearchActive: false,
    searchTimeout: null,
    currentResults: [],

    // Initialize search functionality
    init() {
        const searchInput = document.getElementById('searchInput');
        
        // Add input event listener with debouncing
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // Add keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container') && 
                !e.target.closest('#searchToggleBtn')) {
                this.hideResults();
            }
        });
    },

    // Toggle search visibility
    toggleSearch() {
        this.isSearchActive = !this.isSearchActive;
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        const searchToggleBtn = document.getElementById('searchToggleBtn');
        
        if (this.isSearchActive) {
            searchContainer.classList.add('active');
            searchToggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            // Focus input after animation
            setTimeout(() => searchInput.focus(), 300);
        } else {
            searchContainer.classList.remove('active');
            searchToggleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            this.clearSearch();
        }
    },

    // Handle search input with debouncing
    handleSearchInput(query) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Show/hide clear button
        const clearBtn = document.getElementById('searchClear');
        if (query.trim()) {
            clearBtn.classList.add('active');
        } else {
            clearBtn.classList.remove('active');
            this.hideResults();
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    },

    // Perform the actual search
    performSearch(query) {
        if (!query || query.trim().length < 2) {
            this.hideResults();
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const allStations = DataManager.getAllStations();
        
        // Search through stations
        this.currentResults = allStations.filter(station => {
            const matchName = station.name.toLowerCase().includes(searchTerm);
            const matchBrand = station.brand.toLowerCase().includes(searchTerm);
            const matchCounty = station.county.toLowerCase().includes(searchTerm);
            
            return matchName || matchBrand || matchCounty;
        });

        // Sort results by relevance (exact matches first)
        this.currentResults.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
            const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            
            return a.name.localeCompare(b.name);
        });

        this.displayResults(this.currentResults, searchTerm);
    },

    // Display search results
    displayResults(results, searchTerm) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <div class="search-no-results-icon">
    <i class="fas fa-search"></i>
</div>

                    <div class="search-no-results-text">No stations found for "${searchTerm}"</div>
                </div>
            `;
            resultsContainer.classList.add('active');
            return;
        }

        // Limit results to 10 for performance
        const displayResults = results.slice(0, 10);
        
        resultsContainer.innerHTML = displayResults.map((station, index) => {
            const etimsStatus = DataManager.getEtimsStatus(station.lat, station.lng);
            const color = CONFIG.brandColors[station.brand] || CONFIG.brandColors['Independent'];
            
            // Highlight matching text
            const highlightedName = this.highlightMatch(station.name, searchTerm);
            const highlightedBrand = this.highlightMatch(station.brand, searchTerm);
            const highlightedCounty = this.highlightMatch(station.county, searchTerm);
            
            // Status badge
            const statusConfig = CONFIG.etimsStatus[etimsStatus.status];
            const statusBadge = `
                <span class="search-result-badge" style="background: ${statusConfig.color}20; color: ${statusConfig.color};">
                    ${statusConfig.label}
                </span>
            `;
            
            return `
                <div class="search-result-item" onclick="SearchManager.selectResult(${index})" data-index="${index}">
                    <div class="search-result-icon" style="background: ${color}20; color: ${color};">
    <i class="fas fa-gas-pump"></i>
</div>

                    <div class="search-result-content">
                        <div class="search-result-name">${highlightedName}</div>
                        <div class="search-result-details">
                            <span>${highlightedBrand}</span>
                            <span>•</span>
                            <span>📍 ${highlightedCounty}</span>
                            <span>${statusBadge}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (results.length > 10) {
            resultsContainer.innerHTML += `
                <div class="search-no-results">
                    <div class="search-no-results-text">
                        Showing 10 of ${results.length} results. Refine your search for more specific results.
                    </div>
                </div>
            `;
        }

        resultsContainer.classList.add('active');
    },

    // Highlight matching text
    highlightMatch(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    },

    // Escape regex special characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // Select a search result
    selectResult(index) {
        if (index < 0 || index >= this.currentResults.length) return;
        
        const station = this.currentResults[index];
        
        // Close search
        this.clearSearch();
        this.toggleSearch();
        
        // Zoom to station
        MapManager.map.setView([station.lat, station.lng], 16);
        
        // Find and open popup for this station
        MapManager.markers.forEach(m => {
            if (m.station.lat === station.lat && m.station.lng === station.lng) {
                setTimeout(() => {
                    m.marker.openPopup();
                }, 300);
            }
        });
        
        UI.showToast(`Showing ${station.name}`);
    },

    // Handle keyboard navigation
    handleKeyboardNavigation(e) {
        const results = document.querySelectorAll('.search-result-item');
        
        if (results.length === 0) return;
        
        let currentIndex = -1;
        results.forEach((item, index) => {
            if (item.classList.contains('keyboard-selected')) {
                currentIndex = index;
            }
        });

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNextResult(results, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPreviousResult(results, currentIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    this.selectResult(currentIndex);
                } else if (results.length > 0) {
                    this.selectResult(0);
                }
                break;
            case 'Escape':
                this.clearSearch();
                if (this.isSearchActive) {
                    this.toggleSearch();
                }
                break;
        }
    },

    // Select next result with keyboard
    selectNextResult(results, currentIndex) {
        results.forEach(item => item.classList.remove('keyboard-selected'));
        
        const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        results[nextIndex].classList.add('keyboard-selected');
        results[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },

    // Select previous result with keyboard
    selectPreviousResult(results, currentIndex) {
        results.forEach(item => item.classList.remove('keyboard-selected'));
        
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
        results[prevIndex].classList.add('keyboard-selected');
        results[prevIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },

    // Clear search
    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchClear').classList.remove('active');
        this.hideResults();
        this.currentResults = [];
    },

    // Hide search results
    hideResults() {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.classList.remove('active');
        resultsContainer.innerHTML = '';
    },

    // Search by location (find nearest stations)
    searchNearby(lat, lng, radius = 5000) {
        const allStations = DataManager.getAllStations();
        
        // Calculate distance for each station
        const stationsWithDistance = allStations.map(station => {
            const distance = this.calculateDistance(lat, lng, station.lat, station.lng);
            return { ...station, distance };
        });

        // Filter by radius and sort by distance
        const nearbyStations = stationsWithDistance
            .filter(s => s.distance <= radius)
            .sort((a, b) => a.distance - b.distance);

        return nearbyStations;
    },

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in meters
    }
};