/**
 * Data Manager — sole owner of localStorage.
 *
 * localStorage is the operational database. Firebase (via FirebaseManager +
 * SyncManager) is a synchronization service layered on top: it never writes
 * to localStorage directly, and it never gets to decide what the user sees.
 *
 * Every station / ETIMS / device record carries internal-only metadata:
 *   id            - `${lat}_${lng}`, derived not generated (coords are
 *                   immutable after creation in the edit form, so this is a
 *                   stable permanent key with zero migration cost — it's
 *                   already the de facto key etimsData/deviceData used).
 *   createdAt     - ISO timestamp, set once
 *   updatedAt     - ISO timestamp, bumped on every local change
 *   lastSyncedAt  - ISO timestamp of last successful push, null if never
 *   syncStatus    - 'pending' | 'synced' | 'failed'
 *   deleted       - soft-delete tombstone flag (stations only). A station is
 *                   deleted locally but kept in storage until its delete has
 *                   been pushed, so an offline peer that already has the
 *                   deletion queued can't have it silently resurrected by a
 *                   remote merge, and so other clients merging later can see
 *                   the tombstone instead of the doc just vanishing.
 */

const DataManager = {

    // ---------------------------------------------------------------
    // Low-level storage — the ONLY code in the app allowed to touch
    // localStorage.getItem / setItem for these keys.
    // ---------------------------------------------------------------

    _readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.error(`DataManager: failed to read "${key}" from localStorage`, error);
            return fallback;
        }
    },

    _writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`DataManager: failed to write "${key}" to localStorage`, error);
            return false;
        }
    },

    _now() {
        return new Date().toISOString();
    },

    // Canonical entity id. Coordinates never change after a station is
    // created (the edit form keeps lat/lng fixed), so this is permanent.
    getEntityId(lat, lng) {
        return `${lat}_${lng}`;
    },

    // ---------------------------------------------------------------
    // Raw per-type stores. "station" is an array (order doesn't matter,
    // matches the existing customStations shape); "etims" / "device" are
    // id-keyed maps (matches the existing etimsData/deviceData shape).
    // These generic accessors are what SyncManager talks to.
    // ---------------------------------------------------------------

    _storageKeyFor(type) {
        return {
            station: CONFIG.storage.customStations,
            etims: CONFIG.storage.etimsData,
            device: CONFIG.storage.deviceData
        }[type];
    },

    _readStore(type) {
        const fallback = type === 'station' ? [] : {};
        return this._readJSON(this._storageKeyFor(type), fallback);
    },

    _writeStore(type, value) {
        return this._writeJSON(this._storageKeyFor(type), value);
    },

    getRawRecord(type, id) {
        const store = this._readStore(type);
        if (type === 'station') {
            return store.find(r => r.id === id) || null;
        }
        return store[id] || null;
    },

    _putRawRecord(type, id, record) {
        const store = this._readStore(type);
        if (type === 'station') {
            const idx = store.findIndex(r => r.id === id);
            if (idx !== -1) store[idx] = record;
            else store.push(record);
        } else {
            store[id] = record;
        }
        return this._writeStore(type, store);
    },

    _deleteRawRecord(type, id) {
        const store = this._readStore(type);
        if (type === 'station') {
            const filtered = store.filter(r => r.id !== id);
            return this._writeStore(type, filtered);
        }
        delete store[id];
        return this._writeStore(type, store);
    },

    _stampLocalWrite(existing, fields) {
        const now = this._now();
        return {
            ...(existing || {}),
            ...fields,
            createdAt: (existing && existing.createdAt) || now,
            updatedAt: now,
            syncStatus: 'pending',
            deleted: false
        };
    },

    markSynced(type, id) {
        const record = this.getRawRecord(type, id);
        if (!record) return;
        record.syncStatus = 'synced';
        record.lastSyncedAt = this._now();
        this._putRawRecord(type, id, record);
    },

    markFailed(type, id) {
        const record = this.getRawRecord(type, id);
        if (!record) return;
        record.syncStatus = 'failed';
        this._putRawRecord(type, id, record);
    },

    // ---------------------------------------------------------------
    // Pending sync queue — persisted locally, survives refresh/close.
    // One entry per (type, entityId): re-queuing an entity collapses
    // onto its existing entry rather than piling up duplicates.
    // ---------------------------------------------------------------

    getPendingQueue() {
        return this._readJSON(CONFIG.storage.pendingQueue, []);
    },

    savePendingQueue(queue) {
        return this._writeJSON(CONFIG.storage.pendingQueue, queue);
    },

    enqueueSync(type, entityId, op) {
        const queue = this.getPendingQueue();
        const key = `${type}:${entityId}`;
        const existingIdx = queue.findIndex(q => q.id === key);

        // A create that's deleted again before ever reaching Firebase has
        // nothing to push and nothing to tombstone remotely — cancel out.
        if (op === 'delete' && existingIdx !== -1 && queue[existingIdx].op === 'upsert') {
            const record = this.getRawRecord(type, entityId);
            if (!record || !record.lastSyncedAt) {
                queue.splice(existingIdx, 1);
                this.savePendingQueue(queue);
                return;
            }
        }

        const entry = { id: key, type, entityId, op, queuedAt: this._now() };
        if (existingIdx !== -1) queue[existingIdx] = entry;
        else queue.push(entry);
        this.savePendingQueue(queue);
    },

    removeQueueEntry(key) {
        const queue = this.getPendingQueue().filter(q => q.id !== key);
        this.savePendingQueue(queue);
    },

    // Fire a sync attempt without making the caller wait on the network.
    _kickSync() {
        if (typeof SyncManager !== 'undefined') {
            SyncManager.requestSync();
        }
    },

    // ---------------------------------------------------------------
    // Stations — public API (unchanged signatures, existing callers in
    // UI.js / MapManager.js / DeviceManager.js need no changes).
    // ---------------------------------------------------------------

    // Active (non-deleted) custom stations. This is what the rest of the
    // app should treat as "the custom stations."
    getCustomStations() {
        return this._readStore('station').filter(s => !s.deleted);
    },

    saveCustomStations(stations) {
        return this._writeStore('station', stations);
    },

    // Get all stations (default seed data + custom)
    getAllStations() {
        const defaultStations = typeof STATIONS !== 'undefined' ? STATIONS : [];
        return [...defaultStations, ...this.getCustomStations()];
    },

    addStation(station) {
        const id = this.getEntityId(station.lat, station.lng);
        const existing = this.getRawRecord('station', id);
        const record = this._stampLocalWrite(existing, { ...station, id });
        this._putRawRecord('station', id, record);
        this.enqueueSync('station', id, 'upsert');
        this._kickSync();
        return true;
    },

    updateStation(lat, lng, updatedStation) {
        const id = this.getEntityId(lat, lng);
        const existing = this.getRawRecord('station', id);
        if (!existing) return false;

        const record = this._stampLocalWrite(existing, { ...updatedStation, lat, lng, id });
        this._putRawRecord('station', id, record);
        this.enqueueSync('station', id, 'upsert');
        this._kickSync();
        return true;
    },

    deleteStation(lat, lng) {
        const id = this.getEntityId(lat, lng);
        const existing = this.getRawRecord('station', id);
        if (!existing) return false;

        // Soft delete: keep the record as a tombstone until the delete has
        // synced, so a refresh or an in-flight remote merge can never bring
        // it back from under the user.
        const record = { ...existing, deleted: true, updatedAt: this._now(), syncStatus: 'pending' };
        this._putRawRecord('station', id, record);
        this.enqueueSync('station', id, 'delete');

        // Cascade: ETIMS status and device info belong to the station and
        // don't need to survive it. Queue the delete BEFORE removing the
        // raw record — enqueueSync needs to read lastSyncedAt off it to
        // know whether there's anything to tell Firebase about.
        if (this.getRawRecord('etims', id)) {
            this.enqueueSync('etims', id, 'delete');
            this._deleteRawRecord('etims', id);
        }
        if (this.getRawRecord('device', id)) {
            this.enqueueSync('device', id, 'delete');
            this._deleteRawRecord('device', id);
        }

        this._kickSync();
        return true;
    },

    // ---------------------------------------------------------------
    // ETIMS status
    // ---------------------------------------------------------------

    getEtimsData() {
        return this._readStore('etims');
    },

    saveEtimsData(data) {
        return this._writeStore('etims', data);
    },

    updateEtimsStatus(lat, lng, status, notes = '') {
        const id = this.getEntityId(lat, lng);
        const existing = this.getRawRecord('etims', id);
        const record = this._stampLocalWrite(existing, { id, status, notes });
        this._putRawRecord('etims', id, record);
        this.enqueueSync('etims', id, 'upsert');
        this._kickSync();
        return true;
    },

    getEtimsStatus(lat, lng) {
        const id = this.getEntityId(lat, lng);
        const record = this.getRawRecord('etims', id);
        return record || { status: 'not-started', notes: '', updatedAt: null };
    },

    // ---------------------------------------------------------------
    // Remote merge — called by SyncManager when Firebase reports a
    // change (initial load or realtime listener). Never overwrites
    // unsynced local work.
    // ---------------------------------------------------------------

    mergeRemote(type, entityId, remoteData, changeType) {
        const local = this.getRawRecord(type, entityId);

        if (changeType === 'removed') {
            // Under our tombstone convention this shouldn't normally fire
            // for stations (deletes are soft), but handle it defensively
            // for the etims/device collections and manual console edits.
            if (!local || local.syncStatus === 'pending') return false;
            this._deleteRawRecord(type, entityId);
            return true;
        }

        if (!local) {
            this._putRawRecord(type, entityId, {
                ...remoteData,
                id: entityId,
                syncStatus: 'synced',
                lastSyncedAt: this._now()
            });
            return true;
        }

        if (local.syncStatus === 'pending') {
            // Unsynced local work always wins. It will overwrite this
            // remote version on its own next successful push.
            return false;
        }

        const remoteUpdated = remoteData.updatedAt ? new Date(remoteData.updatedAt).getTime() : 0;
        const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        if (remoteUpdated >= localUpdated) {
            this._putRawRecord(type, entityId, {
                ...remoteData,
                id: entityId,
                syncStatus: 'synced',
                lastSyncedAt: this._now()
            });
            return true;
        }
        return false;
    },

    // ---------------------------------------------------------------
    // Everything below is unchanged from the original implementation.
    // ---------------------------------------------------------------

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

    // Escape values safely for CSV export
    escapeCSV(value) {
        const safeValue = value === undefined || value === null || value === '' ? 'N/A' : String(value);
        return `"${safeValue.replace(/"/g, '""')}"`;
    },

    // Check if a station matches the active search text
    matchesSearchTerm(station, etimsStatus, deviceInfo, searchTerm) {
        if (!searchTerm) return true;

        const valuesToSearch = [
            station.name,
            station.brand,
            station.county,
            etimsStatus.status,
            etimsStatus.notes,
            deviceInfo ? deviceInfo.automationType : '',
            deviceInfo ? deviceInfo.pumpType : '',
            deviceInfo ? deviceInfo.masterIMEI : '',
            deviceInfo ? deviceInfo.slaveIMEI : ''
        ].map(value => String(value || '').toLowerCase());

        return valuesToSearch.some(value => value.includes(searchTerm));
    },

    // Get stations that match the current sidebar filters and search text
    getFilteredStations() {
        const allStations = this.getAllStations();
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        return allStations.filter(station => {
            const etimsStatus = this.getEtimsStatus(station.lat, station.lng);
            const deviceInfo = typeof DeviceManager !== 'undefined'
                ? DeviceManager.getDeviceInfo(station.lat, station.lng)
                : null;

            const passesSidebarFilters = typeof FilterManager === 'undefined'
                ? true
                : FilterManager.shouldShowStation(station, etimsStatus.status, deviceInfo);

            return passesSidebarFilters && this.matchesSearchTerm(station, etimsStatus, deviceInfo, searchTerm);
        });
    },

    // Export data to CSV. By default this exports only the filtered/currently relevant data.
    exportData(exportFilteredOnly = true) {
        const stations = exportFilteredOnly ? this.getFilteredStations() : this.getAllStations();
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';

        if (stations.length === 0) {
            if (typeof UI !== 'undefined') {
                UI.showToast('No matching stations to export. Adjust your filters and try again.');
            }
            return;
        }

        // CSV headers
        const headers = [
            'Station Name',
            'Brand',
            'County',
            'ETIMS Status',
            'Notes',
            'System Type',
            'Pump Type',
            'Master IMEI',
            'Slave IMEI',
            'Last Updated'
        ];

        // CSV rows
        const rows = stations.map(station => {
            const etimsStatus = this.getEtimsStatus(station.lat, station.lng);
            const deviceInfo = typeof DeviceManager !== 'undefined'
                ? DeviceManager.getDeviceInfo(station.lat, station.lng)
                : null;

            return [
                this.escapeCSV(station.name),
                this.escapeCSV(station.brand),
                this.escapeCSV(station.county),
                this.escapeCSV(etimsStatus.status),
                this.escapeCSV(etimsStatus.notes),
                this.escapeCSV(deviceInfo ? deviceInfo.automationType : 'manual'),
                this.escapeCSV(deviceInfo ? deviceInfo.pumpType : ''),
                this.escapeCSV(deviceInfo ? deviceInfo.masterIMEI : ''),
                this.escapeCSV(deviceInfo ? deviceInfo.slaveIMEI : ''),
                this.escapeCSV(etimsStatus.updatedAt)
            ].join(',');
        });

        // Combine headers and rows
        const csv = [headers.join(','), ...rows].join('\n');

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const date = new Date().toISOString().split('T')[0];
        const mode = exportFilteredOnly ? 'filtered' : 'all';
        const searchSuffix = searchTerm ? `_search_${searchTerm.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')}` : '';
        link.download = `etims_tracker_${mode}${searchSuffix}_${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (typeof UI !== 'undefined') {
            const label = exportFilteredOnly ? 'filtered' : 'all';
            UI.showToast(`${stations.length} ${label} station${stations.length === 1 ? '' : 's'} exported successfully!`);
        }
    },

    // Export everything, ignoring filters and search text
    exportAllData() {
        this.exportData(false);
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

                            this.addStation(station);
                            this.updateEtimsStatus(lat, lng,
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
                                    DeviceManager.updateDeviceInfo(lat, lng, deviceInfo);
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
