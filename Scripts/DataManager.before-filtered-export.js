/**
 * Data Manager with Firebase Integration
 * Handles all data operations with automatic Firebase sync
 * Falls back to localStorage if Firebase unavailable
 */

const DataManager = {
    // Get custom stations from localStorage
    getCustomStations() {
        try {
            const data = localStorage.getItem(CONFIG.storage.customStations);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    },

    // Save custom stations to localStorage
    saveCustomStations(stations) {
        try {
            localStorage.setItem(CONFIG.storage.customStations, JSON.stringify(stations));
            return true;
        } catch (error) {
            return false;
        }
    },

    // Get ETIMS data from localStorage
    getEtimsData() {
        try {
            const data = localStorage.getItem(CONFIG.storage.etimsData);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    },

    // Save ETIMS data to localStorage
    saveEtimsData(data) {
        try {
            localStorage.setItem(CONFIG.storage.etimsData, JSON.stringify(data));
            return true;
        } catch (error) {
            return false;
        }
    },

    // Get all stations (default + custom)
    getAllStations() {
        const defaultStations = typeof STATIONS !== 'undefined' ? STATIONS : [];
        const customStations = this.getCustomStations();
        return [...defaultStations, ...customStations];
    },

    // Add a new station (with Firebase sync)
    async addStation(station) {
        const customStations = this.getCustomStations();
        customStations.push(station);
        this.saveCustomStations(customStations);
        
        // Sync to Firebase
        if (typeof FirebaseSync !== 'undefined') {
            await FirebaseSync.addStation(station);
        }
        
        return true;
    },

    // Update a station (with Firebase sync)
    async updateStation(lat, lng, updatedStation) {
        const customStations = this.getCustomStations();
        const index = customStations.findIndex(s => s.lat === lat && s.lng === lng);
        
        if (index !== -1) {
            customStations[index] = { ...updatedStation, lat, lng };
            this.saveCustomStations(customStations);
            
            // Sync to Firebase
            if (typeof FirebaseSync !== 'undefined') {
                await FirebaseSync.updateStation(lat, lng, customStations[index]);
            }
            
            return true;
        }
        
        return false;
    },

    // Delete a station (with Firebase sync)
    async deleteStation(lat, lng) {
        const customStations = this.getCustomStations();
        const filtered = customStations.filter(s => !(s.lat === lat && s.lng === lng));
        
        if (filtered.length !== customStations.length) {
            this.saveCustomStations(filtered);
            
            // Sync to Firebase
            if (typeof FirebaseSync !== 'undefined') {
                await FirebaseSync.deleteStation(lat, lng);
            }
            
            return true;
        }
        
        return false;
    },

    // Update ETIMS status (with Firebase sync)
    async updateEtimsStatus(lat, lng, status, notes = '') {
        const etimsData = this.getEtimsData();
        const stationKey = `${lat}_${lng}`;
        
        etimsData[stationKey] = {
            status: status,
            notes: notes,
            updatedAt: new Date().toISOString()
        };
        
        this.saveEtimsData(etimsData);
        
        // Sync to Firebase
        if (typeof FirebaseSync !== 'undefined') {
            await FirebaseSync.updateEtimsStatus(lat, lng, status, notes);
        }
        
        return true;
    },

    // Get ETIMS status for a station
    getEtimsStatus(lat, lng) {
        const etimsData = this.getEtimsData();
        const stationKey = `${lat}_${lng}`;
        
        return etimsData[stationKey] || {
            status: 'not-started',
            notes: '',
            updatedAt: null
        };
    },

    // Calculate statistics
    calculateStats() {
        const allStations = this.getAllStations();
        const customCount = this.getCustomStations().length;
        
        let liveCount = 0;
        let pendingCount = 0;
        let notStartedCount = 0;
        
        allStations.forEach(station => {
            const status = this.getEtimsStatus(station.lat, station.lng);
            
            if (status.status === 'live') {
                liveCount++;
            } else if (status.status === 'pending') {
                pendingCount++;
            } else {
                notStartedCount++;
            }
        });
        
        const totalStations = allStations.length;
        const progress = totalStations > 0 ? Math.round((liveCount / totalStations) * 100) : 0;
        
        return {
            totalStations,
            customStations: customCount,
            liveCount,
            pendingCount,
            notStartedCount,
            progress
        };
    },

    // Export data to CSV
    exportData() {
        const allStations = this.getAllStations();
        
        // CSV headers
        const headers = [
            'Station Name',
            'Brand',
            'County',
            'ETIMS Status',
            'Notes',
            'Latitude',
            'Longitude',
            'Last Updated'
        ];
        
        // CSV rows
        const rows = allStations.map(station => {
            const etimsStatus = this.getEtimsStatus(station.lat, station.lng);
            
            return [
                `"${station.name}"`,
                `"${station.brand}"`,
                `"${station.county}"`,
                `"${etimsStatus.status}"`,
                `"${etimsStatus.notes || 'N/A'}"`,
                station.lat,
                station.lng,
                `"${etimsStatus.updatedAt || 'N/A'}"`
            ].join(',');
        });
        
        // Combine headers and rows
        const csv = [headers.join(','), ...rows].join('\n');
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `etims_tracker_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        if (typeof UI !== 'undefined') {
            UI.showToast('Data exported successfully!');
        }
    },

    // Import data from CSV file
    async importDataFromCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/).filter(line => line.trim());
                    if (lines.length < 2) return resolve(0);

                    // Robust CSV line parser that handles empty fields and quotes
                    const parseCSVLine = (line) => {
                        const values = [];
                        let curValue = '';
                        let inQuotes = false;
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') inQuotes = !inQuotes;
                            else if (char === ',' && !inQuotes) {
                                values.push(curValue.trim());
                                curValue = '';
                            } else curValue += char;
                        }
                        values.push(curValue.trim());
                        return values.map(v => v.replace(/^"|"$/g, '').trim());
                    };

                    // Clean headers (remove BOM and normalize)
                    const rawHeaders = parseCSVLine(lines[0]);
                    const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, '').toLowerCase());
                    
                    const getIdx = (names) => {
                        for (const name of names) {
                            const lowerName = name.toLowerCase();
                            const idx = headers.findIndex(h => h === lowerName || h.includes(lowerName));
                            if (idx !== -1) return idx;
                        }
                        return -1;
                    };

                    // Map column indices dynamically
                    const nameIdx = getIdx(['Station Name', 'Name']);
                    const brandIdx = getIdx(['Brand']);
                    const countyIdx = getIdx(['County']);
                    const statusIdx = getIdx(['ETIMS Status', 'Status']);
                    const notesIdx = getIdx(['Notes']);
                    const latIdx = getIdx(['Latitude', 'Lat']);
                    const lngIdx = getIdx(['Longitude', 'Lng']);

                    if (latIdx === -1 || lngIdx === -1) {
                        throw new Error("Required columns (Latitude/Longitude) not found.");
                    }

                    let importCount = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i]);
                        if (values.length <= Math.max(latIdx, lngIdx)) continue;

                        const lat = parseFloat(values[latIdx]);
                        const lng = parseFloat(values[lngIdx]);

                        if (!isNaN(lat) && !isNaN(lng)) {
                            const station = {
                                name: values[nameIdx] || 'Unnamed Station',
                                brand: values[brandIdx] || 'Independent',
                                county: values[countyIdx] || 'Unknown',
                                lat: lat,
                                lng: lng
                            };

                            await this.addStation(station);
                            await this.updateEtimsStatus(lat, lng, 
                                (values[statusIdx] || 'not-started').toLowerCase(), 
                                values[notesIdx] || '');

                            // Import automation/device info if available
                            if (typeof DeviceManager !== 'undefined') {
                                const autoIdx = getIdx(['System Type', 'Automation']);
                                const pumpIdx = getIdx(['Pump Type']);
                                
                                if (autoIdx !== -1 || pumpIdx !== -1) {
                                    const deviceInfo = {
                                        automationType: (autoIdx !== -1 && values[autoIdx].toLowerCase().includes('auto')) ? 'automated' : 'manual',
                                        pumpType: pumpIdx !== -1 ? values[pumpIdx] : '',
                                        // Add other fields as needed
                                    };
                                    await DeviceManager.updateDeviceInfo(lat, lng, deviceInfo);
                                }
                            }
                            
                            importCount++;
                        }
                    }
                    resolve(importCount);
                } catch (error) {
                    console.error('Import error:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    },

    // Get unique brands
    getUniqueBrands() {
        const allStations = this.getAllStations();
        const brands = [...new Set(allStations.map(s => s.brand))];
        return brands.sort();
    },

    // Get unique counties
    getUniqueCounties() {
        const allStations = this.getAllStations();
        const counties = [...new Set(allStations.map(s => s.county))];
        return counties.sort();
    }
};
