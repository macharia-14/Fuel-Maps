/* Main Application Entry Point - Initializes all modules and sets up event listeners */
// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ETIMS Tracker starting...');
    
    // Initialize all managers
    MapManager.init();
    FilterManager.init();
    UI.updateStats();
    
    // Set up form submission
    document.getElementById('stationForm').addEventListener('submit', (e) => {
        UI.handleFormSubmit(e);
    });
    
    // Log initialization complete
    console.log('✅ ETIMS Tracker initialized successfully');
    console.log(`📊 Loaded ${DataManager.getAllStations().length} stations`);
    console.log(`📍 Custom stations: ${DataManager.getCustomStations().length}`);
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

console.log('📱 ETIMS Tracker loaded - Ready for use!');