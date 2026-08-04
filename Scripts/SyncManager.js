/**
 * Sync Manager — coordinates DataManager (local truth) and FirebaseManager
 * (remote I/O). DataManager never talks to Firebase directly; FirebaseManager
 * never talks to localStorage directly. This is the module in between.
 */

const SyncManager = {
    _syncing: false,
    _connectivityBound: false,

    init() {
        if (!this._connectivityBound) {
            window.addEventListener('online', () => {
                console.log('🌐 Back online — syncing pending changes...');
                this.requestSync();
            });
            window.addEventListener('offline', () => {
                console.log('📴 Offline — changes will be queued locally.');
            });
            this._connectivityBound = true;
        }

        if (navigator.onLine) {
            this.requestSync();
        }
    },

    // Safe to call any time, from anywhere (DataManager writes call this
    // after every local change). No-ops if there's nothing to do.
    requestSync() {
        if (!navigator.onLine) return;
        if (typeof FirebaseManager === 'undefined' || !FirebaseManager.isInitialized) return;
        this.processQueue();
    },

    async processQueue() {
        if (this._syncing) return;
        this._syncing = true;

        try {
            const queue = DataManager.getPendingQueue();
            if (queue.length === 0) return;

            console.log(`⬆️ Uploading pending queue... (${queue.length} change${queue.length === 1 ? '' : 's'})`);

            for (const entry of [...queue]) {
                try {
                    await this._processEntry(entry);
                    DataManager.removeQueueEntry(entry.id);
                } catch (error) {
                    console.warn(`Upload failed for ${entry.id}, will retry on next sync:`, error);
                    DataManager.markFailed(entry.type, entry.entityId);
                }
            }

            const remaining = DataManager.getPendingQueue().length;
            if (remaining === 0) {
                console.log('✅ Upload successful. Queue empty.');
                this.refreshUI();
            } else {
                console.log(`⚠️ ${remaining} change(s) still pending — will retry.`);
            }
        } finally {
            this._syncing = false;
        }
    },

    async _processEntry(entry) {
        const { type, entityId, op } = entry;

        if (op === 'delete') {
            await FirebaseManager.deleteDoc(type, entityId);
            return;
        }

        const record = DataManager.getRawRecord(type, entityId);
        if (!record) return; // deleted locally before it ever got pushed

        await FirebaseManager.setDoc(type, entityId, record);
        DataManager.markSynced(type, entityId);
    },

    // Called by FirebaseManager for every incoming realtime change.
    // Returns true if the change actually altered local data (used for
    // logging), false if it was ignored (e.g. shadowed by pending local work).
    handleRemoteChange(type, entityId, remoteData, changeType) {
        const changed = DataManager.mergeRemote(type, entityId, remoteData, changeType);
        if (changed) this.refreshUI();
        return changed;
    },

    refreshUI() {
        if (window.MapManager && MapManager.map) {
            MapManager.refreshMarkers();
        }
        if (typeof FilterManager !== 'undefined') {
            FilterManager.populateDropdowns();
        }
        if (typeof UI !== 'undefined') {
            UI.updateStats();
        }
    }
};
