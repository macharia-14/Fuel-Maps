

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
        
        // Close bottom sheet if open
        if (document.getElementById('bottomSheet').classList.contains('active')) {
            this.closeBottomSheet();
        }
    },

    // Show bottom sheet
    showBottomSheet() {
        document.getElementById('bottomSheet').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        
        // Close sidebar if open
        if (document.getElementById('sidebar').classList.contains('active')) {
            this.toggleSidebar();
        }
        
        // Scroll to top of form
        document.querySelector('.sheet-content').scrollTop = 0;
    },

    // Close bottom sheet
    closeBottomSheet() {
        document.getElementById('bottomSheet').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('stationForm').reset();
        
        // Reset form state
        document.getElementById('sheetTitle').textContent = 'Add New Station';
        document.getElementById('sheetSubtitle').textContent = 'Fill in station details';
        document.getElementById('submitBtnText').textContent = 'Add Station';
        
        // Hide IMEI section
        document.getElementById('imeiSection').style.display = 'none';
        
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

    // Toggle add station mode (with debounce to prevent lag)
    toggleAddStation() {
        // Prevent rapid clicks that cause lag
        if (this.fabClickTimeout) return;
        
        this.fabClickTimeout = setTimeout(() => {
            this.fabClickTimeout = null;
        }, 300);
        
        MapManager.addStationMode = !MapManager.addStationMode;
        const fab = document.getElementById('fab');
        
        if (MapManager.addStationMode) {
            fab.classList.add('active');
            this.showToast('Tap on map to add station');
        } else {
            fab.classList.remove('active');
            if (MapManager.tempMarker) {
                MapManager.map.removeLayer(MapManager.tempMarker);
                MapManager.tempMarker = null;
            }
        }
    },

    fabClickTimeout: null,

    // Handle pump type change - show/hide IMEI fields for Wayne pumps
    handlePumpTypeChange() {
        const pumpType = document.getElementById('pumpType').value;
        const imeiSection = document.getElementById('imeiSection');
        
        if (pumpType === 'Wayne') {
            imeiSection.style.display = 'block';
        } else {
            imeiSection.style.display = 'none';
            // Clear IMEI fields when not Wayne
            document.getElementById('masterIMEI').value = '';
            document.getElementById('slaveIMEI').value = '';
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
        
        // Get fuel types (checkboxes)
        const fuelTypes = [];
        document.querySelectorAll('input[name="fuelType"]:checked').forEach(checkbox => {
            fuelTypes.push(checkbox.value);
        });
        
        // Get device data
        const pumpType = document.getElementById('pumpType').value;
        const deviceInfo = {
            pumpType: pumpType,
            masterIMEI: pumpType === 'Wayne' ? document.getElementById('masterIMEI').value.trim() : '',
            slaveIMEI: pumpType === 'Wayne' ? document.getElementById('slaveIMEI').value.trim() : '',
            pumpCount: document.getElementById('pumpCount').value,
            fuelTypes: fuelTypes,
            nozzleCount: document.getElementById('nozzleCount').value,
            nozzlesPerPump: document.getElementById('nozzlesPerPump').value,
            installationDate: document.getElementById('installationDate').value
        };
        
        // Validate IMEI if Wayne pump
        if (pumpType === 'Wayne') {
            if (deviceInfo.masterIMEI && !DeviceManager.validateIMEI(deviceInfo.masterIMEI)) {
                UI.showToast('Invalid Master IMEI (must be 15 digits)');
                return;
            }
            
            if (deviceInfo.slaveIMEI && !DeviceManager.validateIMEI(deviceInfo.slaveIMEI)) {
                UI.showToast('Invalid Slave IMEI (must be 15 digits)');
                return;
            }
        }
        
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
        
        // Save device info
        DeviceManager.updateDeviceInfo(station.lat, station.lng, deviceInfo);
        
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
