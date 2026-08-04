/* Main Application Entry Point - Initializes all modules and sets up event listeners */
// Guard to prevent re-initialization if scripts are loaded twice
if (window.etimsTrackerInitialized) {
    console.warn('⚠️ ETIMS Tracker already initialized. Skipping re-initialization. Please check for duplicate script tags in your HTML.');
} else { // Only proceed if not already initialized
    window.etimsTrackerInitialized = true;

    // Initialize application when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 ETIMS Tracker starting...');

        // Offline-first startup order: local data renders first, Firebase
        // connects after. The app must never depend on Firebase to paint
        // its first frame.
        const localStationCount = DataManager.getCustomStations().length;
        console.log(`Loaded ${localStationCount} station(s) from local storage.`);

        // Initialize all managers (reads from localStorage via DataManager)
        MapManager.init();
        FilterManager.init();
        SearchManager.init();
        UI.updateStats();

        // Connectivity + queued-change sync. Bound regardless of whether
        // Firebase is configured, so offline/online logging still works.
        if (typeof SyncManager !== 'undefined') {
            SyncManager.init();
        }

        // Connect to Firebase last. This only synchronizes — it never gets
        // to decide what's already on screen.
        if (typeof FirebaseManager !== 'undefined') {
            FirebaseManager.init();
        }
        
        // Set up form submission
        document.getElementById('stationForm').addEventListener('submit', (e) => {
            UI.handleFormSubmit(e);
        });
        
        // Set up automation type change listener
        const automationType = document.getElementById('automationType');
        if (automationType) {
            automationType.addEventListener('change', () => UI.handleAutomationTypeChange());
        }

        // Log initialization complete
    });

    // Handle page visibility change (refresh data when page becomes visible)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Refresh data when user returns to tab
            MapManager.refreshMarkers();
            UI.updateStats();
        }
    });

    // Prevent accidental page unload if there's unsaved work
    window.addEventListener('beforeunload', (e) => {
        if (MapManager.addStationMode || UI.editingStation) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });

    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
        UI.showToast('An error occurred. Please refresh the page.');
    });

    // Service worker registration (for offline support - optional)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Uncomment to enable service worker
            // navigator.serviceWorker.register('/sw.js')
            //     .then(reg => console.log('Service Worker registered:', reg))
            //     .catch(err => console.log('Service Worker registration failed:', err));
        });
    }
}