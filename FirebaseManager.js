/* Firebase Manager - Handles synchronization with Cloud Firestore */

const FirebaseManager = {
    db: null,
    isInitialized: false,

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

    init() {
        if (this.config.apiKey === "YOUR_API_KEY") {
            console.warn("⚠️ Firebase not configured. Please add your credentials in Scripts/FirebaseManager.js");
            return;
        }

        try {
            firebase.initializeApp(this.config);
            this.db = firebase.firestore();
            
            // Initialize Analytics if measurementId is present
            if (this.config.measurementId) {
                firebase.analytics();
            }

            this.isInitialized = true;
            console.log("🔥 Firebase initialized");

            // Enable offline persistence so data works without internet
            this.db.enablePersistence().catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
                }
            });

            this.setupListeners();
        } catch (error) {
            console.error("Firebase init error:", error);
        }
    },

    setupListeners() {
        // Listen for station changes across the team
        this.db.collection("stations").onSnapshot((snapshot) => {
            let remoteStations = [];
            snapshot.forEach((doc) => {
                remoteStations.push(doc.data());
            });
            
            if (remoteStations.length > 0) {
                localStorage.setItem(CONFIG.storage.customStations, JSON.stringify(remoteStations));
                this.refreshUI();
            }
        });

        // Listen for individual ETIMS status updates
        this.db.collection("etimsData").onSnapshot((snapshot) => {
            let etimsData = {};
            snapshot.forEach((doc) => {
                etimsData[doc.id] = doc.data();
            });
            localStorage.setItem(CONFIG.storage.etimsData, JSON.stringify(etimsData));
            this.refreshUI();
        });

        // Listen for individual Device/Pump info updates
        this.db.collection("deviceData").onSnapshot((snapshot) => {
            let deviceData = {};
            snapshot.forEach((doc) => {
                deviceData[doc.id] = doc.data();
            });
            localStorage.setItem(CONFIG.storage.deviceData, JSON.stringify(deviceData));
            this.refreshUI();
        });
    },

    refreshUI() {
        if (window.MapManager && MapManager.map) {
            MapManager.refreshMarkers();
            UI.updateStats();
        }
    },

    // Helper to generate a safe Firebase ID from coordinates
    getDocId(lat, lng) {
        return `${lat}_${lng}`.replace(/\./g, '-');
    },

    async saveStation(station) {
        if (!this.isInitialized) return;
        const id = this.getDocId(station.lat, station.lng);
        await this.db.collection("stations").doc(id).set(station);
    },

    async deleteStation(lat, lng) {
        if (!this.isInitialized) return;
        const id = this.getDocId(lat, lng);
        await this.db.collection("stations").doc(id).delete();
        // Also clean up related data
        await this.deleteEtimsData(lat, lng);
        await this.deleteDeviceData(lat, lng);
    },

    async saveEtimsUpdate(lat, lng, data) {
        if (!this.isInitialized) return;
        const id = this.getDocId(lat, lng);
        await this.db.collection("etimsData").doc(id).set(data);
    },

    async deleteEtimsData(lat, lng) {
        if (!this.isInitialized) return;
        await this.db.collection("etimsData").doc(this.getDocId(lat, lng)).delete();
    },

    async saveDeviceUpdate(lat, lng, data) {
        if (!this.isInitialized) return;
        const id = this.getDocId(lat, lng);
        await this.db.collection("deviceData").doc(id).set(data);
    },

    async deleteDeviceData(lat, lng) {
        if (!this.isInitialized) return;
        await this.db.collection("deviceData").doc(this.getDocId(lat, lng)).delete();
    }
};