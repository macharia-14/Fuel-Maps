PS C:\Users\PC\Desktop\ECM\maps\Fuel-Maps-Updated\images\brands> cd "c:\Users\PC\Desktop\ECM\maps\Fuel-Maps-Updated\images\brands" ; find . -name "*.svg" -exec grep -l "font-family" {} \;
FIND: Parameter format not correct# PowerShell script to update all brand SVG logos with fuel pump design
$brandsPath = "c:\Users\PC\Desktop\ECM\maps\Fuel-Maps-Updated\images\brands"

# Brand colors from config.js
$brandColors = @{
    "be-energy" = "#FB5607"
    "delta" = "#118AB2"
    "engen" = "#06D6A0"
    "galana" = "#4ECDC4"
    "gulf-energy" = "#FF7B00"
    "hass" = "#F72585"
    "independent" = "#6C757D"
    "kenol" = "#7209B7"
    "kobil" = "#560BAD"
    "lake-oil" = "#06BCC1"
    "mega-oil" = "#F59E0B"
    "mogas" = "#EC4899"
    "movida-energy" = "#8B5CF6"
    "national-oil" = "#073B4C"
    "oilbiya" = "#3A86FF"
    "ola" = "#FF6B35"
    "other" = "#94A3B8"
    "petroleum-outlets" = "#8338EC"
    "rubis" = "#9D4EDD"
    "shell" = "#FFD60A"
    "stabex" = "#FF006E"
    "tosha-petroleum" = "#10B981"
    "total" = "#E63946"
}

Get-ChildItem "$brandsPath\*.svg" | ForEach-Object {
    $fileName = $_.BaseName
    $color = $brandColors[$fileName]
    if ($color) {
        $brandName = $fileName.ToUpper().Replace('-', ' ')
        if ($brandName -eq "NATIONAL OIL") { $brandName = "NATIONAL OIL" }
        if ($brandName -eq "BE ENERGY") { $brandName = "BE ENERGY" }
        if ($brandName -eq "GULF ENERGY") { $brandName = "GULF ENERGY" }
        if ($brandName -eq "LAKE OIL") { $brandName = "LAKE OIL" }
        if ($brandName -eq "MEGA OIL") { $brandName = "MEGA OIL" }
        if ($brandName -eq "MOVIDA ENERGY") { $brandName = "MOVIDA ENERGY" }
        if ($brandName -eq "TOSHA PETROLEUM") { $brandName = "TOSHA PETROLEUM" }
        if ($brandName -eq "PETROLEUM OUTLETS") { $brandName = "PETROLEUM OUTLETS" }

        $fontSize = if ($brandName.Length -gt 8) { "6" } elseif ($brandName.Length -gt 6) { "7" } else { "8" }

        $svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="${fileName}Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:$color;stop-opacity:1" />
      <stop offset="100%" style="stop-color:$([regex]::Replace($color, '#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})', { param($m) [string]::Format("#{0:X2}{1:X2}{2:X2}", [math]::Max(0, [convert]::ToInt32($m.Groups[1].Value, 16) - 32), [math]::Max(0, [convert]::ToInt32($m.Groups[2].Value, 16) - 32), [math]::Max(0, [convert]::ToInt32($m.Groups[3].Value, 16) - 32)) }))" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="45" fill="url(#${fileName}Gradient)" stroke="#333" stroke-width="2"/>
  <!-- Fuel pump icon -->
  <rect x="35" y="25" width="30" height="35" rx="4" fill="#FFF" stroke="#333" stroke-width="1"/>
  <rect x="40" y="30" width="20" height="8" rx="2" fill="$color"/>
  <circle cx="50" cy="45" r="4" fill="#333"/>
  <rect x="48" y="49" width="4" height="8" fill="#333"/>
  <text x="50" y="75" font-family="Arial, sans-serif" font-size="$fontSize" font-weight="bold" text-anchor="middle" fill="#FFF">$brandName</text>
</svg>
"@

        $svgContent | Out-File -FilePath $_.FullName -Encoding UTF8
        Write-Host "Updated $fileName.svg"
    }
}