# ETIMS Tracker - Petrol Stations Kenya

A mobile-responsive web application for tracking KRA ETIMS integration status across petrol stations in Kenya.


## Getting Started

### Installation

1. Clone or download all files to a directory
2. Open `index.html` in a modern web browser
3. No build process required!


## Features

### Core Functionality
- Add/Edit/Delete petrol stations
- Track ETIMS integration status (Live, Pending, Not Started)
- Filter by status, brand, and county
- Get directions to stations
- Export reports to CSV
- Offline storage (localStorage)

### User Interface
- Fully responsive (mobile, tablet, desktop)
- Modern, professional design
- Smooth animations
- Touch-optimized for mobile
- Real-time statistics dashboard

## Troubleshooting

### Common Issues

**Issue**: Map not loading
- **Solution**: Check internet connection (requires OpenStreetMap tiles)

**Issue**: Location not working
- **Solution**: Enable location permissions in browser

**Issue**: Data not saving
- **Solution**: Check if localStorage is enabled (some browsers block it in private mode)

**Issue**: Markers not showing
- **Solution**: Check browser console for errors, ensure data.js is loaded

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Storage

All data is stored locally in browser localStorage:
- `customStations` - User-added stations
- `etimsData` - ETIMS status for all stations

**Note**: Data is device-specific. For team collaboration, export/import CSV files.

## Contributing

To add features or fix bugs:

1. Identify the appropriate module
2. Add your function to that module
3. Update this README if needed
4. Test across devices


## Support

For issues or questions:
1. Check README
2. Review console logs in browser DevTools
3. Check individual module files for inline documentation



