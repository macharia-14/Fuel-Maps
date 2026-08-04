import os
import requests

# Make sure images folder exists
os.makedirs("images", exist_ok=True)

# List of brand domains (used to fetch logos)
brands = [
    "shell.com",
    "totalenergies.com",
    "rubiskenya.com",
    "olaenergy.com",
    "astrolpetroleum.com",
    "galanaenergies.com",
    "petrogrp.com",
    "gulfenergy.co.ke",
    "hasspetroleum.com",
    "lakeoilgroup.com",
    "lexoenergy.com",
    "stabeexinternational.com",
    "beenergy.co.ke",
    "oryxenergies.com",
    "dalbit.com",
    "saharaenergy.co.ke",
    # Add any other brands you have
]

# Base URL for Clearbit logo service
base_url = "https://logo.clearbit.com/"

for brand in brands:
    try:
        response = requests.get(base_url + brand)
        if response.status_code == 200:
            file_path = os.path.join("images", brand.replace(".com", "").replace(".co.ke","") + ".png")
            with open(file_path, "wb") as f:
                f.write(response.content)
            print(f"Downloaded logo for {brand}")
        else:
            print(f"Failed to fetch logo for {brand} - status code {response.status_code}")
    except Exception as e:
        print(f"Error downloading {brand}: {e}")