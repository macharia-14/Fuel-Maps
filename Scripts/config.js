
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


    // Brand Colors - All major brands in Kenya
    brandColors: {
        // Major Oil Companies
        'Total': '#E63946',
        'Shell': '#FFD60A',
        'Rubis': '#9D4EDD',
        'Kenol': '#7209B7',
        'Kobil': '#560BAD',
        'Ola': '#FF6B35',
        'Galana': '#4ECDC4',
        'Hass': '#F72585',
        'Engen': '#06D6A0',
        'Delta': '#118AB2',
        'National Oil': '#073B4C',
        'Be Energy': '#FB5607',
        
        // Additional Kenyan Brands
        'Stabex': '#FF006E',
        'Petroleum Outlets': '#8338EC',
        'Oilibya': '#3A86FF',
        'Gulf Energy': '#FF7B00',
        'Lake Oil': '#06BCC1',
        'Tosha Petroleum': '#10B981',
        'Mega Oil': '#F59E0B',
        'Movida Energy': '#8B5CF6',
        'Mogas': '#EC4899',
        
        // Independent & Others
        'Independent': '#6C757D',
        'Other': '#94A3B8'
    },

    // Pump Types available in Kenya
    pumpTypes: {
        'Wayne': {
            label: 'Wayne',
            icon: '🔧',
            requiresIMEI: true, // Wayne pumps require IMEI tracking
            description: 'Wayne pumps - IMEI required'
        },
        'Tokheim': {
            label: 'Tokheim',
            icon: '⚙️',
            requiresIMEI: false,
            description: 'Tokheim pumps'
        },
        'Gilbarco': {
            label: 'Gilbarco',
            icon: '🔩',
            requiresIMEI: false,
            description: 'Gilbarco pumps'
        },
        'Dover': {
            label: 'Dover',
            icon: '🛠️',
            requiresIMEI: false,
            description: 'Dover/OPW pumps'
        },
        'Tatsuno': {
            label: 'Tatsuno',
            icon: '⚡',
            requiresIMEI: false,
            description: 'Tatsuno pumps'
        },
        'Censtar': {
            label: 'Censtar',
            icon: '🔌',
            requiresIMEI: false,
            description: 'Censtar pumps'
        },
        'Sanki': {
            label: 'Sanki',
            icon: '⚙️',
            requiresIMEI: false,
            description: 'Sanki pumps'
        },
        'Other': {
            label: 'Other',
            icon: '📦',
            requiresIMEI: false,
            description: 'Other pump types'
        }
    },

    // Fuel Types
    fuelTypes: {
        'Petrol': '⛽',
        'Diesel': '🚛',
        'Kerosene': '🔥',
        'LPG': '💨'
    },

    // ETIMS Status
    etimsStatus: {
        live: {
            label: '✅ Live',
            color: '#10B981',
            description: 'Integrated & Operating'
        },
        pending: {
            label: '⏳ Pending',
            color: '#F59E0B',
            description: 'Integration in Progress'
        },
        'not-started': {
            label: '⭕ Not Started',
            color: '#64748B',
            description: 'Needs Integration'
        }
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

        etimsData: 'etimsData',
        deviceData: 'deviceData',

        etimsData: 'etimsData'

    },

    // UI Configuration
    ui: {
        toastDuration: 3000, // milliseconds
        animationDuration: 300, // milliseconds
        mapClickDelay: 200 // milliseconds
    }

};

