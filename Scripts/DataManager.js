/* Data Manager - Handles all data operations including localStorage */

const DataManager = {
    // Get custom stations from localStorage
    getCustomStations() {
        try {
            const data = localStorage.getItem(CONFIG.storage.customStations);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading custom stations:', error);
            return [];
        }
    },

    // Save custom stations to localStorage
    saveCustomStations(stations) {
        try {
            localStorage.setItem(CONFIG.storage.customStations, JSON.stringify(stations));
            return true;
        } catch (error) {
            console.error('Error saving custom stations:', error);
            UI.showToast('Error saving data');
            return false;
        }
    },

    // Get ETIMS data from localStorage
    getEtimsData() {
        try {
            const data = localStorage.getItem(CONFIG.storage.etimsData);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading ETIMS data:', error);
            return {};
        }
    },

    // Save ETIMS data to localStorage
    saveEtimsData(data) {
        try {
            localStorage.setItem(CONFIG.storage.etimsData, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving ETIMS data:', error);
            UI.showToast('Error saving ETIMS data');
            return false;
        }
    },

    // Get all stations (default + custom)
    getAllStations() {
        return [...petrolStations, ...this.getCustomStations()];
    },

    // Add a new custom station
    addStation(station) {
        const customStations = this.getCustomStations();
        customStations.push(station);
        return this.saveCustomStations(customStations);
    },

    // Update an existing station
    updateStation(lat, lng, updatedStation) {
        const customStations = this.getCustomStations();
        const index = customStations.findIndex(s => s.lat === lat && s.lng === lng);
        
        if (index !== -1) {
            customStations[index] = updatedStation;
            return this.saveCustomStations(customStations);
        }
        return false;
    },

    // Delete a custom station
    deleteStation(lat, lng) {
        let customStations = this.getCustomStations();
        customStations = customStations.filter(s => !(s.lat === lat && s.lng === lng));
        
        // Also delete ETIMS data
        const etimsData = this.getEtimsData();
        const stationKey = `${lat}_${lng}`;
        delete etimsData[stationKey];
        this.saveEtimsData(etimsData);
        
        return this.saveCustomStations(customStations);
    },

    // Update ETIMS status for a station
    updateEtimsStatus(lat, lng, status, notes = '') {
        const etimsData = this.getEtimsData();
        const stationKey = `${lat}_${lng}`;
        
        etimsData[stationKey] = {
            status: status,
            notes: notes,
            updatedAt: new Date().toISOString()
        };
        
        return this.saveEtimsData(etimsData);
    },

    // Get ETIMS status for a station
    getEtimsStatus(lat, lng) {
        const etimsData = this.getEtimsData();
        const stationKey = `${lat}_${lng}`;
        return etimsData[stationKey] || { status: 'not-started', notes: '' };
    },

    // Calculate statistics
    calculateStats() {
        const allStations = this.getAllStations();
        const etimsData = this.getEtimsData();
        
        let liveCount = 0;
        let pendingCount = 0;
        let notStartedCount = 0;
        
        allStations.forEach(station => {
            const stationKey = `${station.lat}_${station.lng}`;
            const status = (etimsData[stationKey] || { status: 'not-started' }).status;
            
            if (status === 'live') liveCount++;
            else if (status === 'pending') pendingCount++;
            else notStartedCount++;
        });
        
        const total = allStations.length;
        const progress = total > 0 ? Math.round((liveCount / total) * 100) : 0;
        
        return {
            liveCount,
            pendingCount,
            notStartedCount,
            totalStations: total,
            customStations: this.getCustomStations().length,
            progress
        };
    },

    // Export data to CSV
    exportData() {
        const allStations = this.getAllStations();
        const etimsData = this.getEtimsData();
        
        // Create CSV header
        const headers = ['Station Name', 'Brand', 'County', 'ETIMS Status', 'Notes', 'Last Updated', 'Latitude', 'Longitude'];
        
        // Create CSV rows
        const rows = allStations.map(station => {
            const stationKey = `${station.lat}_${station.lng}`;
            const etims = etimsData[stationKey] || { status: 'not-started', notes: '', updatedAt: '' };
            
            return [
                `"${station.name}"`,
                `"${station.brand}"`,
                `"${station.county}"`,
                `"${etims.status}"`,
                `"${etims.notes || ''}"`,
                `"${etims.updatedAt ? new Date(etims.updatedAt).toLocaleString() : 'N/A'}"`,
                station.lat,
                station.lng
            ].join(',');
        });
        
        // Combine headers and rows
        const csv = [headers.join(','), ...rows].join('\n');
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `etims_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        UI.showToast('Report exported successfully!');
    },

    // Get unique brands
    getUniqueBrands() {
        const allStations = this.getAllStations();
        return [...new Set(allStations.map(s => s.brand))].sort();
    },

    // Get unique counties
    getUniqueCounties() {
        const allStations = this.getAllStations();
        return [...new Set(allStations.map(s => s.county))].sort();
    }
};