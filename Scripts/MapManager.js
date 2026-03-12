
const MapManager = {
    map: null,
    markers: [],
    routingControl: null,
    userLocation: null,
    userLocationMarker: null,
    tempMarker: null,
    newStationLatLng: null,
    addStationMode: false,

    // Initialize the map
    init() {
        this.map = L.map('map', {
            zoomControl: false,
            tap: true, // Enable mobile tap
            touchZoom: true,
            dragging: true
        }).setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);
        
        // Add tile layer
        L.tileLayer(CONFIG.map.tileLayer, {
            attribution: CONFIG.map.attribution,
            maxZoom: CONFIG.map.maxZoom
        }).addTo(this.map);

        // Add zoom control to bottom left
        L.control.zoom({
            position: 'bottomleft'
        }).addTo(this.map);

        // Add map click handler
        this.map.on('click', (e) => this.handleMapClick(e));
        
        // Load all stations
        this.loadStations();
    },

    // Load all stations onto the map
    loadStations() {
        const allStations = DataManager.getAllStations();
        const customCount = DataManager.getCustomStations().length;
        
        allStations.forEach((station, index) => {
            const isCustom = index >= (allStations.length - customCount);
            this.addStationMarker(station, isCustom);
        });
    },

    // Add a station marker to the map
    addStationMarker(station, isCustom = false) {
        const etimsStatus = DataManager.getEtimsStatus(station.lat, station.lng);
        
        // Apply filters
        if (!FilterManager.shouldShowStation(station, etimsStatus.status)) {
            return;
        }
        
        const color = CONFIG.brandColors[station.brand] || CONFIG.brandColors['Independent'];
        const isLive = etimsStatus.status === 'live';
        
        // Create marker icon HTML
        const iconHtml = `
            <div style="position: relative; width: 24px; height: 24px;">
                ${isLive ? '<div class="pulse-ring"></div>' : ''}
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: ${isLive ? '18px' : '16px'};
                    height: ${isLive ? '18px' : '16px'};
                    background: ${color};
                    border: 3px solid ${isLive ? '#10B981' : 'white'};
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
            </div>
        `;
        
        // Create marker
        const marker = L.marker([station.lat, station.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: iconHtml,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        });

        // Create popup content
        const popupContent = this.createPopupContent(station, etimsStatus, color, isCustom);
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        }).addTo(this.map);
        
        this.markers.push({ marker, station, isCustom, etimsStatus: etimsStatus.status });
    },

    // Create popup content HTML
    createPopupContent(station, etimsStatus, color, isCustom) {
        const statusBadgeClass = {
            'live': 'status-live',
            'pending': 'status-pending',
            'not-started': 'status-not-started'
        }[etimsStatus.status];

        const statusBadgeText = CONFIG.etimsStatus[etimsStatus.status].label;

        const notesHtml = etimsStatus.notes ? 
            `<div class="popup-notes">📝 ${etimsStatus.notes}</div>` : '';

        // Get device info
        const deviceInfo = DeviceManager.getDeviceInfo(station.lat, station.lng);
        let deviceHtml = '';
        
        if (deviceInfo && deviceInfo.pumpType) {
            deviceHtml = '<div class="popup-devices">';
            deviceHtml += `<div class="device-section-title"><i class="fas fa-gas-pump"></i> Pump Info</div>`;
            
            deviceHtml += `<div class="device-item">
                <span class="device-label">Type:</span>
                <span class="device-value">${deviceInfo.pumpType}</span>
            </div>`;
            
            // Show IMEI only for Wayne pumps
            if (deviceInfo.pumpType === 'Wayne') {
                if (deviceInfo.masterIMEI) {
                    deviceHtml += `<div class="device-item">
                        <span class="device-label">🖥️ Master:</span>
                        <span class="device-value">${DeviceManager.formatIMEI(deviceInfo.masterIMEI)}</span>
                    </div>`;
                }
                
                if (deviceInfo.slaveIMEI) {
                    deviceHtml += `<div class="device-item">
                        <span class="device-label">📱 Slave:</span>
                        <span class="device-value">${DeviceManager.formatIMEI(deviceInfo.slaveIMEI)}</span>
                    </div>`;
                }
            }
            
            if (deviceInfo.pumpCount) {
                deviceHtml += `<div class="device-item">
                    <span class="device-label">Pumps:</span>
                    <span class="device-value">${deviceInfo.pumpCount}</span>
                </div>`;
            }
            
            if (deviceInfo.fuelTypes && deviceInfo.fuelTypes.length > 0) {
                const fuelIcons = CONFIG.fuelTypes;
                const fuelTypesDisplay = deviceInfo.fuelTypes.map(type => 
                    `${fuelIcons[type] || '•'} ${type}`
                ).join(', ');
                
                deviceHtml += `<div class="device-item">
                    <span class="device-label">Fuels:</span>
                    <span class="device-value">${fuelTypesDisplay}</span>
                </div>`;
            }
            
            if (deviceInfo.nozzleCount) {
                deviceHtml += `<div class="device-item">
                    <span class="device-label">Nozzles:</span>
                    <span class="device-value">${deviceInfo.nozzleCount} total</span>
                </div>`;
            }
            
            deviceHtml += '</div>';
        }

        const deleteBtn = isCustom ? 
            `<button class="popup-btn popup-btn-secondary" onclick="MapManager.deleteStation(${station.lat}, ${station.lng})"><i class="fas fa-trash"></i> Delete</button>` : '';

        return `
            <div class="popup-content">
                <div class="popup-header">
                    <div class="status-badge ${statusBadgeClass}">${statusBadgeText}</div>
                    <div class="popup-brand" style="color: ${color};">${station.brand}</div>
                    <div class="popup-name">${station.name}</div>
                    <div class="popup-location"><i class="fas fa-map-marker-alt"></i> ${station.county} County</div>
                </div>
                ${notesHtml}
                ${deviceHtml}
                <div class="popup-actions">
                    <button class="popup-btn popup-btn-primary" onclick="MapManager.getDirections(${station.lat}, ${station.lng})"><i class="fas fa-directions"></i> Directions</button>
                    <button class="popup-btn popup-btn-secondary" onclick="MapManager.editStation(${station.lat}, ${station.lng})"><i class="fas fa-edit"></i> Edit</button>
                    ${deleteBtn}
                </div>
            </div>
        `;
    },

    // Refresh all markers (e.g., after filter change)
    refreshMarkers() {
        // Remove all markers
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
        
        // Reload stations
        this.loadStations();
    },

    // Handle map click
    handleMapClick(e) {
        if (this.addStationMode) {
            this.newStationLatLng = e.latlng;
            
            // Remove previous temp marker
            if (this.tempMarker) {
                this.map.removeLayer(this.tempMarker);
            }
            
            // Add new temp marker
            this.tempMarker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'temp-marker',
                    html: `
                        <div style="position: relative; width: 28px; height: 28px;">
                            <div class="pulse-ring"></div>
                            <div style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 20px;
                                height: 20px;
                                background: #10B981;
                                border: 3px solid white;
                                border-radius: 50%;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            "></div>
                        </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(this.map);
            
            // Update form
            document.getElementById('stationLatLng').value = 
                `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
            
            // Show bottom sheet
            UI.showBottomSheet();
            this.addStationMode = false;
            document.getElementById('fab').classList.remove('active');
        }
    },

    // Get user's current location
    getUserLocation() {
        if (navigator.geolocation) {
            UI.showToast('Getting your location...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = L.latLng(position.coords.latitude, position.coords.longitude);
                    
                    // Remove existing user location marker
                    if (this.userLocationMarker) {
                        this.map.removeLayer(this.userLocationMarker);
                    }
                    
                    // Add user location marker
                    this.userLocationMarker = L.marker(this.userLocation, {
                        icon: L.divIcon({
                            className: 'user-marker',
                            html: `
                                <div style="position: relative; width: 32px; height: 32px;">
                                    <div class="pulse-ring" style="border-color: #3B82F6;"></div>
                                    <div style="
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);
                                        width: 20px;
                                        height: 20px;
                                        background: #3B82F6;
                                        border: 3px solid white;
                                        border-radius: 50%;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                    "></div>
                                </div>
                            `,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })
                    }).addTo(this.map);
                    
                    this.map.setView(this.userLocation, 15);
                    
                    // Show location info panel
                    this.showUserLocationPanel();
                    
                    UI.showToast('Location found!');
                },
                (error) => {
                    UI.showToast('Could not get location');
                    console.error('Geolocation error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            UI.showToast('Geolocation not supported');
        }
    },

    // Show user location panel with "Add Station Here" button
    showUserLocationPanel() {
        const panel = document.getElementById('userLocationInfo');
        panel.style.display = 'flex';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            panel.style.display = 'none';
        }, 10000);
    },

    // Add station at user's current location
    addStationAtUserLocation() {
        if (!this.userLocation) {
            UI.showToast('Location not available');
            return;
        }
        
        this.newStationLatLng = this.userLocation;
        
        // Remove previous temp marker
        if (this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
        }
        
        // Add temp marker at user location
        this.tempMarker = L.marker(this.userLocation, {
            icon: L.divIcon({
                className: 'temp-marker',
                html: `
                    <div style="position: relative; width: 28px; height: 28px;">
                        <div class="pulse-ring"></div>
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 20px;
                            height: 20px;
                            background: #10B981;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        "></div>
                    </div>
                `,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            })
        }).addTo(this.map);
        
        // Update form
        document.getElementById('stationLatLng').value = 
            `${this.userLocation.lat.toFixed(6)}, ${this.userLocation.lng.toFixed(6)}`;
        
        // Update sheet subtitle
        document.getElementById('sheetSubtitle').textContent = 'Adding station at your location';
        
        // Show bottom sheet
        UI.showBottomSheet();
        
        // Hide location panel
        document.getElementById('userLocationInfo').style.display = 'none';
    },

    // Get directions to a station
    getDirections(lat, lng) {
        if (!this.userLocation) {
            this.getUserLocation();
            setTimeout(() => {
                if (this.userLocation) {
                    this.createRoute(lat, lng);
                } else {
                    UI.showToast('Enable location to get directions');
                }
            }, 2000);
        } else {
            this.createRoute(lat, lng);
        }
    },

    // Create route on map
    createRoute(destLat, destLng) {
        // Remove existing route
        if (this.routingControl) {
            this.map.removeControl(this.routingControl);
        }
        
        this.routingControl = L.Routing.control({
            waypoints: [this.userLocation, L.latLng(destLat, destLng)],
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            lineOptions: {
                styles: [{ color: '#10B981', opacity: 0.8, weight: 6 }]
            },
            createMarker: () => null
        }).addTo(this.map);

        this.routingControl.on('routesfound', (e) => {
            const route = e.routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(1);
            const time = Math.round(route.summary.totalTime / 60);
            UI.showToast(`${distance} km • ~${time} min`);
        });
    },

    // Edit station
    editStation(lat, lng) {
        const allStations = DataManager.getAllStations();
        const station = allStations.find(s => s.lat === lat && s.lng === lng);
        
        if (!station) return;
        
        const etimsStatus = DataManager.getEtimsStatus(lat, lng);
        const deviceInfo = DeviceManager.getDeviceInfo(lat, lng) || {};
        
        // Update form
        document.getElementById('sheetTitle').textContent = 'Edit Station';
        document.getElementById('sheetSubtitle').textContent = station.name;
        document.getElementById('submitBtnText').textContent = 'Update Station';
        
        document.getElementById('stationName').value = station.name;
        document.getElementById('stationBrand').value = station.brand;
        document.getElementById('stationCounty').value = station.county;
        document.getElementById('etimsStatus').value = etimsStatus.status;
        document.getElementById('etimsNotes').value = etimsStatus.notes || '';
        document.getElementById('stationLatLng').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Load device data
        document.getElementById('pumpType').value = deviceInfo.pumpType || '';
        document.getElementById('masterIMEI').value = deviceInfo.masterIMEI || '';
        document.getElementById('slaveIMEI').value = deviceInfo.slaveIMEI || '';
        document.getElementById('pumpCount').value = deviceInfo.pumpCount || '';
        document.getElementById('nozzleCount').value = deviceInfo.nozzleCount || '';
        document.getElementById('nozzlesPerPump').value = deviceInfo.nozzlesPerPump || '';
        document.getElementById('installationDate').value = deviceInfo.installationDate || '';
        
        // Show/hide IMEI section based on pump type
        UI.handlePumpTypeChange();
        
        // Load fuel types (checkboxes)
        document.querySelectorAll('input[name="fuelType"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        if (deviceInfo.fuelTypes && Array.isArray(deviceInfo.fuelTypes)) {
            deviceInfo.fuelTypes.forEach(type => {
                const checkbox = document.querySelector(`input[name="fuelType"][value="${type}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        this.newStationLatLng = { lat, lng };
        UI.editingStation = { lat, lng };
        
        UI.showBottomSheet();
    },

    // Delete station
    deleteStation(lat, lng) {
        if (!confirm('Delete this station?')) return;
        
        if (DataManager.deleteStation(lat, lng)) {
            DeviceManager.deleteDeviceInfo(lat, lng);
            this.refreshMarkers();
            UI.updateStats();
            UI.showToast('Station deleted');
        }
    },

    // Toggle add station mode
    toggleAddMode(active) {
        this.addStationMode = active;
        
        if (!active && this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
    }
};
