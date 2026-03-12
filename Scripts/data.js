/* Petrol Station Data - Sample data for petrol stations across Kenya */

const petrolStations = [
    // NAIROBI COUNTY
    { name: 'Total Westlands', brand: 'Total', lat: -1.2675, lng: 36.8090, county: 'Nairobi' },
    { name: 'Shell Karen', brand: 'Shell', lat: -1.3195, lng: 36.7073, county: 'Nairobi' },
    { name: 'Rubis Kilimani', brand: 'Rubis', lat: -1.2921, lng: 36.7822, county: 'Nairobi' },
    { name: 'Ola Parklands', brand: 'Ola', lat: -1.2621, lng: 36.8251, county: 'Nairobi' },
    { name: 'Galana Eastleigh', brand: 'Galana', lat: -1.2815, lng: 36.8444, county: 'Nairobi' },
    { name: 'Total CBD', brand: 'Total', lat: -1.2864, lng: 36.8172, county: 'Nairobi' },
    { name: 'Shell Upperhill', brand: 'Shell', lat: -1.2895, lng: 36.8128, county: 'Nairobi' },
    { name: 'Ola South C', brand: 'Ola', lat: -1.3155, lng: 36.8297, county: 'Nairobi' },
    { name: 'Rubis Ngong Road', brand: 'Rubis', lat: -1.3012, lng: 36.7819, county: 'Nairobi' },
    { name: 'Galana Industrial Area', brand: 'Galana', lat: -1.3214, lng: 36.8561, county: 'Nairobi' },
    { name: 'Hass Lavington', brand: 'Hass', lat: -1.2789, lng: 36.7756, county: 'Nairobi' },
    { name: 'Total Yaya Centre', brand: 'Total', lat: -1.2852, lng: 36.7953, county: 'Nairobi' },
    { name: 'Shell Sarit Centre', brand: 'Shell', lat: -1.2606, lng: 36.7974, county: 'Nairobi' },
    { name: 'Kenol Museum Hill', brand: 'Kenol', lat: -1.2701, lng: 36.8145, county: 'Nairobi' },
    { name: 'Kobil Mombasa Road', brand: 'Kobil', lat: -1.3086, lng: 36.8503, county: 'Nairobi' },
    { name: 'Delta Langata', brand: 'Delta', lat: -1.3523, lng: 36.7450, county: 'Nairobi' },
    { name: 'Engen Riverside', brand: 'Engen', lat: -1.2678, lng: 36.8235, county: 'Nairobi' },
    { name: 'Total Waiyaki Way', brand: 'Total', lat: -1.2592, lng: 36.7812, county: 'Nairobi' },
    { name: 'Shell Kileleshwa', brand: 'Shell', lat: -1.2831, lng: 36.7832, county: 'Nairobi' },
    
    // MOMBASA COUNTY
    { name: 'Total Nyali', brand: 'Total', lat: -4.0435, lng: 39.7159, county: 'Mombasa' },
    { name: 'Shell Mombasa CBD', brand: 'Shell', lat: -4.0511, lng: 39.6686, county: 'Mombasa' },
    { name: 'Rubis Diani', brand: 'Rubis', lat: -4.2898, lng: 39.5794, county: 'Mombasa' },
    { name: 'Ola Bamburi', brand: 'Ola', lat: -4.0130, lng: 39.7350, county: 'Mombasa' },
    { name: 'Galana Mtwapa', brand: 'Galana', lat: -3.9433, lng: 39.7384, county: 'Mombasa' },
    { name: 'Total Likoni', brand: 'Total', lat: -4.0896, lng: 39.6753, county: 'Mombasa' },
    { name: 'Shell Mombasa Road', brand: 'Shell', lat: -4.0563, lng: 39.6632, county: 'Mombasa' },
    { name: 'Hass Mombasa', brand: 'Hass', lat: -4.0489, lng: 39.6705, county: 'Mombasa' },
    
    // KISUMU COUNTY
    { name: 'Total Kisumu', brand: 'Total', lat: -0.0917, lng: 34.7680, county: 'Kisumu' },
    { name: 'Shell Kisumu', brand: 'Shell', lat: -0.0965, lng: 34.7574, county: 'Kisumu' },
    { name: 'Ola Kisumu', brand: 'Ola', lat: -0.1022, lng: 34.7617, county: 'Kisumu' },
    { name: 'Rubis Kisumu', brand: 'Rubis', lat: -0.0889, lng: 34.7612, county: 'Kisumu' },
    { name: 'Galana Kisumu', brand: 'Galana', lat: -0.0978, lng: 34.7701, county: 'Kisumu' },
    
    // NAKURU COUNTY
    { name: 'Total Nakuru Town', brand: 'Total', lat: -0.3031, lng: 36.0800, county: 'Nakuru' },
    { name: 'Shell Nakuru', brand: 'Shell', lat: -0.2827, lng: 36.0666, county: 'Nakuru' },
    { name: 'Rubis Nakuru', brand: 'Rubis', lat: -0.2983, lng: 36.0758, county: 'Nakuru' },
    { name: 'Ola Nakuru', brand: 'Ola', lat: -0.2945, lng: 36.0713, county: 'Nakuru' },
    { name: 'Galana Nakuru', brand: 'Galana', lat: -0.2889, lng: 36.0824, county: 'Nakuru' },
    { name: 'Total Naivasha', brand: 'Total', lat: -0.7167, lng: 36.4333, county: 'Nakuru' },
    { name: 'Shell Naivasha', brand: 'Shell', lat: -0.7211, lng: 36.4389, county: 'Nakuru' },
    { name: 'Hass Nakuru', brand: 'Hass', lat: -0.2912, lng: 36.0685, county: 'Nakuru' },
    
    // ELDORET (UASIN GISHU)
    { name: 'Total Eldoret', brand: 'Total', lat: 0.5143, lng: 35.2698, county: 'Uasin Gishu' },
    { name: 'Shell Eldoret', brand: 'Shell', lat: 0.5200, lng: 35.2833, county: 'Uasin Gishu' },
    { name: 'Ola Eldoret', brand: 'Ola', lat: 0.5175, lng: 35.2765, county: 'Uasin Gishu' },
    { name: 'Rubis Eldoret', brand: 'Rubis', lat: 0.5123, lng: 35.2721, county: 'Uasin Gishu' },
    { name: 'Kenol Eldoret', brand: 'Kenol', lat: 0.5189, lng: 35.2812, county: 'Uasin Gishu' },
    
    // KIAMBU COUNTY
    { name: 'Total Thika Road', brand: 'Total', lat: -1.2230, lng: 36.8897, county: 'Kiambu' },
    { name: 'Shell Ruiru', brand: 'Shell', lat: -1.1510, lng: 36.9605, county: 'Kiambu' },
    { name: 'Galana Thika', brand: 'Galana', lat: -1.0332, lng: 37.0692, county: 'Kiambu' },
    { name: 'Rubis Kikuyu', brand: 'Rubis', lat: -1.2456, lng: 36.6623, county: 'Kiambu' },
    { name: 'Total Limuru', brand: 'Total', lat: -1.1103, lng: 36.6428, county: 'Kiambu' },
    { name: 'Ola Juja', brand: 'Ola', lat: -1.0984, lng: 37.0123, county: 'Kiambu' },
    { name: 'Shell Kiambu Town', brand: 'Shell', lat: -1.1714, lng: 36.8356, county: 'Kiambu' },
    
    // MERU COUNTY
    { name: 'Total Meru', brand: 'Total', lat: 0.0469, lng: 37.6503, county: 'Meru' },
    { name: 'Shell Meru', brand: 'Shell', lat: 0.0512, lng: 37.6556, county: 'Meru' },
    { name: 'Ola Meru', brand: 'Ola', lat: 0.0489, lng: 37.6534, county: 'Meru' },
    { name: 'Rubis Meru', brand: 'Rubis', lat: 0.0501, lng: 37.6489, county: 'Meru' },
    
    // NYERI COUNTY
    { name: 'Total Nyeri', brand: 'Total', lat: -0.4197, lng: 36.9473, county: 'Nyeri' },
    { name: 'Shell Nyeri', brand: 'Shell', lat: -0.4241, lng: 36.9534, county: 'Nyeri' },
    { name: 'Rubis Nyeri', brand: 'Rubis', lat: -0.4223, lng: 36.9512, county: 'Nyeri' },
    { name: 'Ola Nyeri', brand: 'Ola', lat: -0.4189, lng: 36.9501, county: 'Nyeri' },
    
    // MACHAKOS COUNTY
    { name: 'Total Machakos', brand: 'Total', lat: -1.5177, lng: 37.2634, county: 'Machakos' },
    { name: 'Shell Machakos', brand: 'Shell', lat: -1.5234, lng: 37.2589, county: 'Machakos' },
    { name: 'Ola Machakos', brand: 'Ola', lat: -1.5198, lng: 37.2678, county: 'Machakos' },
    
    // KAJIADO COUNTY
    { name: 'Total Rongai', brand: 'Total', lat: -1.3912, lng: 36.7234, county: 'Kajiado' },
    { name: 'Shell Ngong', brand: 'Shell', lat: -1.3523, lng: 36.6789, county: 'Kajiado' },
    { name: 'Rubis Kitengela', brand: 'Rubis', lat: -1.4678, lng: 36.9534, county: 'Kajiado' },
    
    // KAKAMEGA COUNTY
    { name: 'Total Kakamega', brand: 'Total', lat: 0.2827, lng: 34.7519, county: 'Kakamega' },
    { name: 'Shell Kakamega', brand: 'Shell', lat: 0.2889, lng: 34.7556, county: 'Kakamega' },
    { name: 'Ola Kakamega', brand: 'Ola', lat: 0.2856, lng: 34.7489, county: 'Kakamega' },
    
    // Additional counties can be added here
];