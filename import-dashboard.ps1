# Import BuyIndiaX Dashboard to Grafana
Write-Host "Importing BuyIndiaX Dashboard to Grafana..."

# Read the dashboard JSON
$dashboardJson = Get-Content -Path "grafana-dashboard.json" -Raw | ConvertFrom-Json

# Wrap it in the required format for Grafana API
$importPayload = @{
    dashboard = $dashboardJson
    overwrite = $true
    inputs = @()
} | ConvertTo-Json -Depth 20

# Read Grafana credentials from environment variables
$grafanaUser = if ($env:GRAFANA_USER) { $env:GRAFANA_USER } else { "admin" }
$grafanaPass = if ($env:GRAFANA_PASSWORD) { $env:GRAFANA_PASSWORD } else {
    Read-Host "Enter Grafana admin password" -AsSecureString
}

if ($grafanaPass -is [string]) {
    $grafanaPass = ConvertTo-SecureString $grafanaPass -AsPlainText -Force
}

$credential = New-Object System.Management.Automation.PSCredential($grafanaUser, $grafanaPass)

# Import to Grafana
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:64034/api/dashboards/db" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $importPayload `
        -Credential $credential

    Write-Host "Dashboard imported successfully!"
    Write-Host "Dashboard URL: http://127.0.0.1:64034/d/buyindiax-k8s/buyindiax-kubernetes-monitoring"

} catch {
    Write-Host "Import failed: $($_.Exception.Message)"
    Write-Host "Try manual import instead:"
    Write-Host "  1. Go to http://127.0.0.1:64034"
    Write-Host "  2. Click '+' -> Import"
    Write-Host "  3. Upload grafana-dashboard.json"
}
