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

    // Real Brand Logos (local paths - add more as images become available)
    brandLogos: {
        'Shell':  'images/shell.png',
        'Total':  'images/Totalenergies.png',
        'Rubis':  'images/Rubis.png',
        'Ola':    'images/ola.jpeg',
        'Galana': 'images/galana.png',
        'Engen':  'images/Engen.jpeg',
        'Hass':   'images/Hass.png',
        'Stabex': 'images/Stabex.png',
        'Towba':  'images/towba.png',
        'Astrol': 'images/Astrol.png',
        'Be Energy': 'images/Beeenergy.png',
        'Dalbit': 'images/Dalbit.jpeg',
        'Gapco':  'images/gapco.png',
        'Green Wells': 'images/greenwells.png',
        'Gulf Energy': 'images/gulf.png',
        'Lake Oil': 'images/Lakeoil.png',
        'Lexo':   'images/Lexo.png',
        'Oryx':   'images/Oryx.jpeg',
        'Petrolcam': 'images/Petrolcam.png',
        
        'Towba':  'images/towba.png',
        'Petro Oil':  'images/petrooil.png',
        'Sahara':  'images/Sahara.png',
        'Kenol':  'images/kenol.png',
        'Kobil':  'images/kobil.png',
        'Delta':  'images/delta.png',
        'National Oil': 'images/Nationaloil.png',
        'Petroleum Outlets': 'images/petroleumoutlets.png',
        'Oilibya': 'images/oilibya.png',
        'Tosha Petroleum': 'images/Tosha.png',
        'Mega Oil': 'images/mega.png',
        'Movida Energy': 'images/movida.png',
        'Mogas': 'images/mogas.png',
        // Add more as needed
    },

    // Brand Colors - All major brands in Kenya
    brandColors: {
        // From user list
        'Astrol': '#eccb0fed',
        'Be Energy': '#00A651',
        'Dalbit': '#FFC20E',
        'Engen': '#FF0000',
        'Galana': '#E30613',  // Galana red (primary brand color)
        'Gapco': '#008000',
        'Green Wells': '#228B22',
        'Gulf Energy': '#06A4DE',
        'Hass': '#CA8A10',
        'Lake Oil': '#0029996f',
        'Lexo': '#084298',
        'Ola': '#0072BC',    // OLA Energy blue
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
            label: ' Live',
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
        deviceData: 'deviceData',
        pendingQueue: 'pendingSyncQueue'
    },

    // UI Configuration
    ui: {
        toastDuration: 3000, // milliseconds
        animationDuration: 300, // milliseconds
        mapClickDelay: 200 // milliseconds
    }
};
