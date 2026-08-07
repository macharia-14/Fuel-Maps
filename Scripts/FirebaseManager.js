/**
 * Firebase Manager — thin I/O layer over Cloud Firestore.
 *
 * This is the ONLY module that talks to the Firestore SDK. It never touches
 * localStorage. Incoming realtime changes are handed to SyncManager, which
 * merges them via DataManager — they never overwrite local data directly.
 */

const FirebaseManager = {
    db: null,
    isInitialized: false,
    _initialLoadLogged: { station: false, etims: false, device: false },

    // ⚠️ TODO: Replace these with your actual Firebase project credentials
    config: {
        apiKey: "AIzaSyB27mVnnClG675Mbrkx6oWyg3d_gCx1MeY",
        authDomain: "tims-tracker.firebaseapp.com",
        databaseURL: "https://tims-tracker-default-rtdb.firebaseio.com",
        projectId: "tims-tracker",
        storageBucket: "tims-tracker.firebasestorage.app",
        messagingSenderId: "26046509272",
        appId: "1:26046509272:web:4c4111649c81b1486f67ad",
        measurementId: "G-0RYBD4K3BX"
    },

    // type -> Firestore collection name
    collectionFor(type) {
        return { station: 'stations', etims: 'etimsData', device: 'deviceData' }[type];
    },

    init() {
        if (this.config.apiKey === "YOUR_API_KEY") {
            console.warn("⚠️ Firebase not configured. Please add your credentials in Scripts/FirebaseManager.js");
            return;
        }

        try {
            firebase.initializeApp(this.config);
            this.db = firebase.firestore();
            this.isInitialized = true;

            try {
                if (this.config.measurementId) firebase.analytics();
            } catch (e) {
                console.warn("Analytics initialization failed");
            }

            // Deliberately NOT calling enablePersistence(). DataManager +
            // localStorage is already our offline-first source of truth —
            // Firestore's own IndexedDB persistence layer duplicates that
            // and, per Lighthouse, its bootstrap is the dominant cost in a
            // ~41s main-thread block on this SDK (two ~10s tasks). Nothing
            // in this app reads from Firestore's local cache directly, so
            // there was no upside to it, just the cost.
            this.setupListeners();

            // We may already have a queue of local changes from while this
            // client was offline — attempt to push them now that we're
            // connected.
            if (typeof SyncManager !== 'undefined') {
                SyncManager.requestSync();
            }
        } catch (error) {
            console.error("Firebase init error:", error);
        }
    },

    setupListeners() {
        ['station', 'etims', 'device'].forEach(type => this._listen(type));
    },

    _listen(type) {
        this.db.collection(this.collectionFor(type)).onSnapshot((snapshot) => {
            if (!this._initialLoadLogged[type]) {
                this._initialLoadLogged[type] = true;
                console.log(`Loaded ${snapshot.size} ${type} record(s) from Firebase.`);
            }

            if (typeof SyncManager === 'undefined') return;

            let mergedCount = 0;
            snapshot.docChanges().forEach((change) => {
                const changed = SyncManager.handleRemoteChange(type, change.doc.id, change.doc.data(), change.type);
                if (changed) mergedCount++;
            });
            if (mergedCount > 0) {
                console.log(`Merged ${mergedCount} remote change(s) into ${type}.`);
            }
        }, (err) => {
            console.error(`Firebase listener error (${type}):`, err);
        });
    },

    // Push the current local state of one entity up to Firestore.
    // Local-only bookkeeping (syncStatus, lastSyncedAt) is never written
    // remotely — it means something different on every client.
    async setDoc(type, id, record) {
        if (!this.isInitialized) throw new Error('Firebase not initialized');
        const { syncStatus, lastSyncedAt, ...payload } = record;
        await this.db.collection(this.collectionFor(type)).doc(id).set(payload);
    },

    // Soft-delete tombstone, so a peer that's still offline and later syncs
    // sees an explicit "this was deleted" rather than the doc just vanishing
    // (which we can't distinguish from "I haven't uploaded it yet").
    async deleteDoc(type, id) {
        if (!this.isInitialized) throw new Error('Firebase not initialized');
        await this.db.collection(this.collectionFor(type)).doc(id)
            .set({ deleted: true, updatedAt: new Date().toISOString() }, { merge: true });
    }
};
