/* Configuration file for ETIMS Tracker - Contains all constants and configuration settings */

const CONFIG = {
    // Map Configuration
    map: {
        defaultCenter: [-0.0236, 37.9062], // Kenya center
        defaultZoom: 6,
        maxZoom: 18,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },

 brandColors: {
    'Total': '#E30613',        // Red
    'Shell': '#FFD500',        // Yellow
    'Rubis': '#005BAC',        // Blue
    'Kenol': '#009640',        // Green
    'Kobil': '#0072CE',        // Blue
    'Ola': '#F57C00',          // Orange
    'Galana': '#6A1B9A',       // Purple
    'Hass': '#2E7D32',         // Dark Green
    'Engen': '#003A8F',        // Navy
    'Delta': '#C62828',        // Dark Red
    'National Oil': '#455A64', // Slate
    'Be Energy': '#00838F',    // Teal
    'Independent': '#757575',  // Gray
    'Pending': '#FFA500'       // Distinct Orange for pending stations
},


    // ETIMS Status
    etimsStatus: {
    live: {
        label: '<i class="fas fa-check-circle"></i> Live',
        color: '#10B981', // green
        description: 'Integrated & Operating'
    },
    pending: {
        label: '<i class="fas fa-hourglass-half"></i> Pending',
        color: '#F59E0B', // amber/orange
        description: 'Integration in Progress'
    },
    'not-started': {
        label: '<i class="far fa-circle"></i> Not Started',
        color: '#64748B', // slate gray
        description: 'Needs Integration'
    }
},


    // LocalStorage Keys
    storage: {
        customStations: 'customStations',
        etimsData: 'etimsData'
    },

    // UI Configuration
    ui: {
        toastDuration: 3000, // milliseconds
        animationDuration: 300, // milliseconds
        mapClickDelay: 200 // milliseconds
    }
};