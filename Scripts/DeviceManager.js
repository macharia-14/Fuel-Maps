/**
 * Device Manager
 * Handles tracking of devices and pump configurations
 * IMEI tracking only for Wayne pumps
 */

const DeviceManager = {
    // Get device data from localStorage
    getDeviceData() {
        try {
            const data = localStorage.getItem(CONFIG.storage.deviceData);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading device data:', error);
            return {};
        }
    },

    // Save device data to localStorage
    saveDeviceData(data) {
        try {
            localStorage.setItem(CONFIG.storage.deviceData, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving device data:', error);
            return false;
        }
    },

    // Update device info for a station
    updateDeviceInfo(lat, lng, deviceInfo) {
        const deviceData = this.getDeviceData();
        const stationKey = `${lat}_${lng}`;
        
        deviceData[stationKey] = {
            pumpType: deviceInfo.pumpType || '',
            masterIMEI: deviceInfo.masterIMEI || '',
            slaveIMEI: deviceInfo.slaveIMEI || '',
            pumpCount: deviceInfo.pumpCount || 0,
            fuelTypes: deviceInfo.fuelTypes || [],
            nozzleCount: deviceInfo.nozzleCount || 0,
            nozzlesPerPump: deviceInfo.nozzlesPerPump || '',
            installationDate: deviceInfo.installationDate || '',
            updatedAt: new Date().toISOString()
        };
        
        return this.saveDeviceData(deviceData);
    },

    // Get device info for a station
    getDeviceInfo(lat, lng) {
        const deviceData = this.getDeviceData();
        const stationKey = `${lat}_${lng}`;
        return deviceData[stationKey] || null;
    },

    // Check if pump type requires IMEI
    requiresIMEI(pumpType) {
        return pumpType === 'Wayne';
    },

    // Validate IMEI number (15 digits)
    validateIMEI(imei) {
        if (!imei) return true; // Optional field
        
        // Remove spaces and dashes
        const cleanIMEI = imei.replace(/[\s-]/g, '');
        
        // Check if it's 15 digits
        if (!/^\d{15}$/.test(cleanIMEI)) {
            return false;
        }
        
        return true;
    },

    // Search stations by IMEI
    searchByIMEI(imei) {
        const deviceData = this.getDeviceData();
        const allStations = DataManager.getAllStations();
        const results = [];
        
        const cleanSearch = imei.replace(/[\s-]/g, '').toLowerCase();
        
        allStations.forEach(station => {
            const stationKey = `${station.lat}_${station.lng}`;
            const deviceInfo = deviceData[stationKey];
            
            if (deviceInfo && deviceInfo.pumpType === 'Wayne') {
                const masterMatch = deviceInfo.masterIMEI && 
                    deviceInfo.masterIMEI.replace(/[\s-]/g, '').toLowerCase().includes(cleanSearch);
                const slaveMatch = deviceInfo.slaveIMEI && 
                    deviceInfo.slaveIMEI.replace(/[\s-]/g, '').toLowerCase().includes(cleanSearch);
                
                if (masterMatch || slaveMatch) {
                    results.push({
                        station,
                        deviceInfo,
                        matchType: masterMatch ? 'master' : 'slave'
                    });
                }
            }
        });
        
        return results;
    },

    // Get statistics about devices
    getDeviceStats() {
        const deviceData = this.getDeviceData();
        const allStations = DataManager.getAllStations();
        
        let waynePumpsWithIMEI = 0;
        let totalPumps = 0;
        let totalNozzles = 0;
        const pumpTypeStats = {};
        const fuelTypeStats = {
            'Petrol': 0,
            'Diesel': 0,
            'Kerosene': 0,
            'LPG': 0
        };
        
        allStations.forEach(station => {
            const stationKey = `${station.lat}_${station.lng}`;
            const deviceInfo = deviceData[stationKey];
            
            if (deviceInfo) {
                // Count pump types
                if (deviceInfo.pumpType) {
                    pumpTypeStats[deviceInfo.pumpType] = (pumpTypeStats[deviceInfo.pumpType] || 0) + 1;
                }
                
                // Count Wayne pumps with IMEI
                if (deviceInfo.pumpType === 'Wayne' && 
                    (deviceInfo.masterIMEI || deviceInfo.slaveIMEI)) {
                    waynePumpsWithIMEI++;
                }
                
                // Count total pumps and nozzles
                if (deviceInfo.pumpCount) {
                    totalPumps += parseInt(deviceInfo.pumpCount) || 0;
                }
                
                if (deviceInfo.nozzleCount) {
                    totalNozzles += parseInt(deviceInfo.nozzleCount) || 0;
                }
                
                // Count fuel types
                if (deviceInfo.fuelTypes && Array.isArray(deviceInfo.fuelTypes)) {
                    deviceInfo.fuelTypes.forEach(type => {
                        if (fuelTypeStats[type] !== undefined) {
                            fuelTypeStats[type]++;
                        }
                    });
                }
            }
        });
        
        return {
            waynePumpsWithIMEI,
            totalPumps,
            totalNozzles,
            pumpTypeStats,
            fuelTypeStats,
            totalStations: allStations.length
        };
    },

    // Export device data to CSV
    exportDeviceData() {
        const deviceData = this.getDeviceData();
        const allStations = DataManager.getAllStations();
        
        // Create CSV header
        const headers = [
            'Station Name', 'Brand', 'County', 
            'Pump Type', 'Master IMEI', 'Slave IMEI', 
            'Pump Count', 'Fuel Types', 'Total Nozzles', 
            'Nozzles per Pump', 'Installation Date', 
            'Latitude', 'Longitude'
        ];
        
        // Create CSV rows
        const rows = allStations.map(station => {
            const stationKey = `${station.lat}_${station.lng}`;
            const deviceInfo = deviceData[stationKey] || {};
            
            const fuelTypes = deviceInfo.fuelTypes && Array.isArray(deviceInfo.fuelTypes) 
                ? deviceInfo.fuelTypes.join('; ') 
                : 'N/A';
            
            return [
                `"${station.name}"`,
                `"${station.brand}"`,
                `"${station.county}"`,
                `"${deviceInfo.pumpType || 'N/A'}"`,
                `"${deviceInfo.masterIMEI || 'N/A'}"`,
                `"${deviceInfo.slaveIMEI || 'N/A'}"`,
                deviceInfo.pumpCount || 0,
                `"${fuelTypes}"`,
                deviceInfo.nozzleCount || 0,
                `"${deviceInfo.nozzlesPerPump || 'N/A'}"`,
                `"${deviceInfo.installationDate || 'N/A'}"`,
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
        link.download = `etims_full_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        UI.showToast('Report exported successfully!');
    },

    // Delete device info for a station
    deleteDeviceInfo(lat, lng) {
        const deviceData = this.getDeviceData();
        const stationKey = `${lat}_${lng}`;
        
        if (deviceData[stationKey]) {
            delete deviceData[stationKey];
            return this.saveDeviceData(deviceData);
        }
        
        return true;
    },

    // Format IMEI for display (adds dashes)
    formatIMEI(imei) {
        if (!imei) return '';
        
        const clean = imei.replace(/[\s-]/g, '');
        if (clean.length === 15) {
            return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 14)}-${clean.slice(14)}`;
        }
        
        return imei;
    }
};
