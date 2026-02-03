/* UI Manager - Handles all UI interactions and updates */

const UI = {
    editingStation: null,

    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, CONFIG.ui.toastDuration);
    },

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    },

    // Show bottom sheet
    showBottomSheet() {
        document.getElementById('bottomSheet').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    },

    // Close bottom sheet
    closeBottomSheet() {
        document.getElementById('bottomSheet').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('stationForm').reset();
        
        // Reset form state
        document.getElementById('sheetTitle').textContent = 'Add New Station';
        document.getElementById('sheetSubtitle').textContent = 'Click on map to select location';
        document.getElementById('submitBtnText').textContent = 'Add Station';
        
        // Remove temp marker
        if (MapManager.tempMarker) {
            MapManager.map.removeLayer(MapManager.tempMarker);
            MapManager.tempMarker = null;
        }
        
        // Reset editing state
        this.editingStation = null;
        MapManager.addStationMode = false;
        document.getElementById('fab').classList.remove('active');
    },

    // Close all overlays
    closeAll() {
        document.getElementById('sidebar').classList.remove('active');
        this.closeBottomSheet();
    },

    // Toggle add station mode
    toggleAddStation() {
        MapManager.addStationMode = !MapManager.addStationMode;
        const fab = document.getElementById('fab');
        
        if (MapManager.addStationMode) {
            fab.classList.add('active');
            this.showToast('Click on map to add station');
        } else {
            fab.classList.remove('active');
            if (MapManager.tempMarker) {
                MapManager.map.removeLayer(MapManager.tempMarker);
                MapManager.tempMarker = null;
            }
        }
    },

    // Update statistics display
    updateStats() {
        const stats = DataManager.calculateStats();
        
        // Update header stats
        document.getElementById('liveCount').textContent = stats.liveCount;
        document.getElementById('pendingCount').textContent = stats.pendingCount;
        document.getElementById('notStartedCount').textContent = stats.notStartedCount;
        
        // Update sidebar stats
        document.getElementById('liveCountFilter').textContent = stats.liveCount;
        document.getElementById('pendingCountFilter').textContent = stats.pendingCount;
        document.getElementById('notStartedCountFilter').textContent = stats.notStartedCount;
        document.getElementById('totalStations').textContent = stats.totalStations;
        document.getElementById('customStations').textContent = stats.customStations;
        document.getElementById('progressPercent').textContent = `${stats.progress}%`;
        document.getElementById('progressBar').style.width = `${stats.progress}%`;
    },

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!MapManager.newStationLatLng && !UI.editingStation) {
            UI.showToast('Please select a location on the map');
            return;
        }
        
        // Get form data
        const station = {
            name: document.getElementById('stationName').value,
            brand: document.getElementById('stationBrand').value,
            county: document.getElementById('stationCounty').value,
            lat: UI.editingStation ? UI.editingStation.lat : MapManager.newStationLatLng.lat,
            lng: UI.editingStation ? UI.editingStation.lng : MapManager.newStationLatLng.lng
        };
        
        const etimsStatus = document.getElementById('etimsStatus').value;
        const etimsNotes = document.getElementById('etimsNotes').value;
        
        // Save station
        if (UI.editingStation) {
            // Update existing
            DataManager.updateStation(UI.editingStation.lat, UI.editingStation.lng, station);
            UI.showToast('Station updated!');
        } else {
            // Add new
            DataManager.addStation(station);
            UI.showToast('Station added!');
        }
        
        // Save ETIMS status
        DataManager.updateEtimsStatus(station.lat, station.lng, etimsStatus, etimsNotes);
        
        // Remove temp marker
        if (MapManager.tempMarker) {
            MapManager.map.removeLayer(MapManager.tempMarker);
            MapManager.tempMarker = null;
        }
        
        // Refresh map and stats
        MapManager.refreshMarkers();
        FilterManager.populateDropdowns();
        UI.updateStats();
        UI.closeBottomSheet();
        
        // Move to station location if new
        if (!UI.editingStation) {
            MapManager.map.setView([station.lat, station.lng], 15);
        }
    }
};