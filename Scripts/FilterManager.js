/* Filter Manager - Handles all filtering operations */

const FilterManager = {
    state: {
        live: true,
        pending: true,
        notStarted: true,
        brand: '',
        county: '',
        pumpType: ''
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

        // Populate pump types
        const pumpTypeFilter = document.getElementById('pumpTypeFilter');
        const pumpTypes = CONFIG.pumpTypes;
        
        pumpTypeFilter.innerHTML = '<option value="">All Pump Types</option>';
        for (const key in pumpTypes) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = pumpTypes[key].label;
            pumpTypeFilter.appendChild(option);
        }
    },

    // Toggle status filter
    toggleFilter(status) {
        // Read actual checkbox state to ensure sync with UI
        let checkboxId = '';
        if (status === 'live') checkboxId = 'filterLive';
        else if (status === 'pending') checkboxId = 'filterPending';
        else if (status === 'notStarted') checkboxId = 'filterNotStarted';
        
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            this.state[status] = checkbox.checked;
        } else {
            this.state[status] = !this.state[status];
        }
        
        this.applyFilters();
    },

    // Apply all filters
    applyFilters() {
        this.state.brand = document.getElementById('brandFilter').value;
        this.state.county = document.getElementById('countyFilter').value;
        this.state.pumpType = document.getElementById('pumpTypeFilter').value;
        
        MapManager.refreshMarkers();
        UI.updateStats();
    },

    // Check if a station should be shown based on filters
    shouldShowStation(station, status, deviceInfo) {
        // Status filter
        if (status === 'live' && !this.state.live) return false;
        if (status === 'pending' && !this.state.pending) return false;
        if (status === 'not-started' && !this.state.notStarted) return false;
        
        // Brand filter
        if (this.state.brand && station.brand !== this.state.brand) return false;
        
        // County filter
        if (this.state.county && station.county !== this.state.county) return false;
        
        // Pump Type filter
        const stationPumpType = deviceInfo ? deviceInfo.pumpType : '';
        if (this.state.pumpType && stationPumpType !== this.state.pumpType) return false;
        
        return true;
    },

    // Reset all filters
    resetFilters() {
        this.state = {
            live: true,
            pending: true,
            notStarted: true,
            brand: '',
            county: '',
            pumpType: ''
        };
        
        document.getElementById('filterLive').checked = true;
        document.getElementById('filterPending').checked = true;
        document.getElementById('filterNotStarted').checked = true;
        document.getElementById('brandFilter').value = '';
        document.getElementById('countyFilter').value = '';
        document.getElementById('pumpTypeFilter').value = '';
        
        this.applyFilters();
    }
};