# Fix anonymous default exports
# Files to fix
$files = @(
    "src/tenant/utils/validationUtils.js",
    "src/tenant/utils/stringUtils.js",
    "src/tenant/utils/roomUtils.js",
    "src/tenant/utils/formatUtils.js",
    "src/tenant/utils/apiUtils.js",
    "src/user/services/aiAnalyticsService.js",
    "src/utils/formatters.js"
)

foreach ($file in $files) {
    $path = Join-Path (Get-Location) $file
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        
        # Read the file
        $content = Get-Content $path -Raw
        
        # Check if it has anonymous export
        if ($content -match "export default \{") {
            # Replace anonymous export with named export
            $varName = [System.IO.Path]::GetFileNameWithoutExtension($file)
            $varName = $varName -creplace '([a-z])([A-Z])', '$1_$2' -creplace '_', ''
            $varName = ($varName -split '' | where {$_} | foreach {if ($_ -match '[a-z]') {$_} else {$_.ToLower()}}) -join ''
            
            Write-Host "  Variable name: $varName"
        }
    }
}
