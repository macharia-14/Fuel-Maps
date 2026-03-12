/* Filter Manager - Handles all filtering operations */

const FilterManager = {
    state: {
        live: true,
        pending: true,
        notStarted: true,
        brand: '',
        county: ''
    },

    // Initialize filters
    init() {
        this.populateDropdowns();
    },

    // Populate brand and county dropdowns
    populateDropdowns() {
        // Populate brands
        const brandFilter = document.getElementById('brandFilter');
        const brands = DataManager.getUniqueBrands();
        
        brandFilter.innerHTML = '<option value="">All Brands</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
        
        // Populate counties
        const countyFilter = document.getElementById('countyFilter');
        const counties = DataManager.getUniqueCounties();
        
        countyFilter.innerHTML = '<option value="">All Counties</option>';
        counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countyFilter.appendChild(option);
        });
    },

    // Toggle status filter
    toggleFilter(status) {
        this.state[status] = !this.state[status];
        this.applyFilters();
    },

    // Apply all filters
    applyFilters() {
        this.state.brand = document.getElementById('brandFilter').value;
        this.state.county = document.getElementById('countyFilter').value;
        
        MapManager.refreshMarkers();
        UI.updateStats();
    },

    // Check if a station should be shown based on filters
    shouldShowStation(station, status) {
        // Status filter
        if (status === 'live' && !this.state.live) return false;
        if (status === 'pending' && !this.state.pending) return false;
        if (status === 'not-started' && !this.state.notStarted) return false;
        
        // Brand filter
        if (this.state.brand && station.brand !== this.state.brand) return false;
        
        // County filter
        if (this.state.county && station.county !== this.state.county) return false;
        
        return true;
    },

    // Reset all filters
    resetFilters() {
        this.state = {
            live: true,
            pending: true,
            notStarted: true,
            brand: '',
            county: ''
        };
        
        document.getElementById('filterLive').checked = true;
        document.getElementById('filterPending').checked = true;
        document.getElementById('filterNotStarted').checked = true;
        document.getElementById('brandFilter').value = '';
        document.getElementById('countyFilter').value = '';
        
        this.applyFilters();
    }
};