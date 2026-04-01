/**
 * Configuration file for ETIMS Tracker
 * Contains all constants and configuration settings
 */

const CONFIG = {
    // Map Configuration
    map: {
        defaultCenter: [-0.0236, 37.9062], // Kenya center
        defaultZoom: 6,
        maxZoom: 18,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },

    // Real Brand Logos (optional, will override generated initial)
    brandLogos: {
        'Shell': 'https://upload.wikimedia.org/wikipedia/en/e/e8/Shell_logo.svg',
        'Total': 'https://upload.wikimedia.org/wikipedia/en/9/9b/TotalEnergies_logo.svg',
        'Rubis': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Rubis_logo.svg'
    },

    // Brand Colors - All major brands in Kenya
    brandColors: {
        // From user list
        'Astrol': '#eccb0fed',
        'Be Energy': '#00A651',
        'Dalbit': '#FFC20E',
        'Engen': '#FF0000',
        'Galana': '#85217A',
        'Gapco': '#008000',
        'Green Wells': '#228B22',
        'Gulf Energy': '#06A4DE',
        'Hass': '#CA8A10',
        'Lake Oil': '#0029996f',
        'Lexo': '#084298',
        'Ola': '#FF5500', // OLA Energy
        'Oryx': '#E31837',
        'Petro': '#dda2c0',
        'Rubis': '#C5212A', // Rubis Energy (KenolKobil)
        'Sahara': '#d7b776',
        'Shell': '#FBCE07',
        'Stabex': '#008000',
        'Total': '#FF0000', // TotalEnergies
        'Towba': '#000000',

        // Existing from old config not in new list
        'Kenol': '#7209B7',
        'Kobil': 'rgb(124, 145, 167)',
        'Delta': '#118AB2',
        'National Oil': '#073B4C',
        'Petroleum Outlets': '#383838',
        'Oilibya': '#3A86FF',
        'Tosha Petroleum': '#10B981',
        'Mega Oil': '#F59E0B',
        'Movida Energy': '#626165',
        'Mogas': '#EC4899',
        
        // Independent & Others
        'Independent': '#808080',
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

    // LocalStorage Keys
    storage: {
        customStations: 'customStations',
        etimsData: 'etimsData',
        deviceData: 'deviceData'
    },

    // UI Configuration
    ui: {
        toastDuration: 3000, // milliseconds
        animationDuration: 300, // milliseconds
        mapClickDelay: 200 // milliseconds
    }
};
