/* Search Manager- Handles search functionality for petrol stations */

const SearchManager = {
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
            if (!e.target.closest('.search-bar-container')) {
                this.hideResults();
            }
        });
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

    // Perform an external search using Nominatim API
    async performExternalSearch(query) {
        // Bias search to Kenya for relevant results
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=5`;

        try {
            const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            if (!response.ok) return [];

            const data = await response.json();
            return data.map(item => ({
                name: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                isExternal: true
            }));
        } catch (error) {
            console.error('External search failed:', error);
            return [];
        }
    },

    // Perform the actual search
    async performSearch(query) {
        if (!query || query.trim().length < 2) {
            this.hideResults();
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const isNumericSearch = /^\d{3,}/.test(searchTerm.replace(/[\s-]/g, ''));
        
        // 1. Perform IMEI search if applicable
        let imeiResults = [];
        if (isNumericSearch) {
            const imeiMatches = DeviceManager.searchByIMEI(searchTerm);
            imeiResults = imeiMatches.map(match => ({
                ...match.station,
                isImeiResult: true,
                imeiMatchType: match.matchType,
                matchedImei: match.matchType === 'master' ? match.deviceInfo.masterIMEI : match.deviceInfo.slaveIMEI
            }));
        }

        // 2. Perform local name/brand/county search
        const allStations = DataManager.getAllStations();
        const localResults = allStations.filter(station => {
            const matchName = station.name.toLowerCase().includes(searchTerm);
            const matchBrand = station.brand.toLowerCase().includes(searchTerm);
            const matchCounty = station.county.toLowerCase().includes(searchTerm);
            return matchName || matchBrand || matchCounty;
        });

        // 3. Perform external search (only if not a pure numeric search)
        let externalResults = [];
        if (!/^\d+$/.test(searchTerm.replace(/[\s-]/g, ''))) {
             externalResults = await this.performExternalSearch(query);
        }

        // 4. Combine results, ensuring no duplicates, prioritizing IMEI matches
        const combined = [];
        const seenKeys = new Set();

        const addResult = (station) => {
            const key = `${station.lat}_${station.lng}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                combined.push(station);
            }
        };

        imeiResults.forEach(addResult);
        localResults.forEach(addResult);

        // Filter out external results that are duplicates of local ones
        const uniqueExternalResults = externalResults.filter(extResult => {
            return !combined.some(localResult => {
                const distance = this.calculateDistance(extResult.lat, extResult.lng, localResult.lat, localResult.lng);
                return distance < 100;
            });
        });

        combined.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
            const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            return a.name.localeCompare(b.name);
        });

        this.currentResults = [...combined, ...uniqueExternalResults];
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
            // Handle IMEI results
            if (station.isImeiResult) {
                const color = CONFIG.brandColors[station.brand] || CONFIG.brandColors['Independent'];
                return `
                    <div class="search-result-item" onclick="SearchManager.selectResult(${index})" data-index="${index}">
                        <div class="search-result-icon" style="background: ${color}20; color: ${color};">
                            <i class="fas fa-barcode"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-name">${this.highlightMatch(station.name, searchTerm)}</div>
                            <div class="search-result-details">
                                <span>IMEI Match on ${station.imeiMatchType}</span>
                                <span>•</span>
                                <span>${this.highlightMatch(DeviceManager.formatIMEI(station.matchedImei), searchTerm)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Handle external results
            if (station.isExternal) {
                return `
                    <div class="search-result-item" onclick="SearchManager.selectExternalResult(${index})" data-index="${index}">
                        <div class="search-result-icon" style="background: #6c757d20; color: #6c757d;">
                            <i class="fas fa-globe-africa"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-name">${this.highlightMatch(station.name, searchTerm)}</div>
                            <div class="search-result-details"><span>External Result</span></div>
                        </div>
                    </div>
                `;
            }

            // Existing code for local results
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
        
        // Clear search input and results
        this.clearSearch();
        
        // Reset filters to ensure the station is visible on the map
        FilterManager.resetFilters();
        
        // Zoom to station with animation
        MapManager.map.flyTo([station.lat, station.lng], 16, {
            duration: 1.5
        });
        
        // Find and open popup for this station
        setTimeout(() => {
            MapManager.markers.forEach(m => {
                if (m.station.lat === station.lat && m.station.lng === station.lng) {
                    m.marker.openPopup();
                }
            });
        }, 1600);
        
        UI.showToast(`📍 ${station.name}`);
    },

    // Select an external search result
    selectExternalResult(index) {
        if (index < 0 || index >= this.currentResults.length) return;

        const result = this.currentResults[index];

        // Clear search
        this.clearSearch();

        // Fly to location
        MapManager.map.flyTo([result.lat, result.lng], 16, {
            duration: 1.5
        });

        // After flying, prompt to add a new station
        const suggestedName = result.name.split(',')[0];
        setTimeout(() => {
            MapManager.promptToAddStationAt({ lat: result.lat, lng: result.lng }, suggestedName);
        }, 1600); // Wait for flyTo animation

        UI.showToast(`Selected: ${suggestedName}`);
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
                    const selectedItem = this.currentResults[currentIndex];
                    if (selectedItem.isExternal) {
                        this.selectExternalResult(currentIndex);
                    } else {
                        this.selectResult(currentIndex);
                    }
                } else if (results.length > 0) {
                    this.currentResults[0].isExternal ? this.selectExternalResult(0) : this.selectResult(0);
                }
                break;
            case 'Escape':
                this.clearSearch();
                document.getElementById('searchInput').blur();
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