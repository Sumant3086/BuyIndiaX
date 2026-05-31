# Generate CPU and Memory Load for Demo
Write-Host "🚀 Generating load for Grafana demo..."

# CPU Load Generator
$jobs = @()
for ($i = 1; $i -le 3; $i++) {
    $job = Start-Job -ScriptBlock {
        $endTime = (Get-Date).AddMinutes(5)
        while ((Get-Date) -lt $endTime) {
            $result = 1
            for ($j = 1; $j -le 100000; $j++) {
                $result = $result * 1.1
            }
            Start-Sleep -Milliseconds 100
        }
    }
    $jobs += $job
    Write-Host "Started CPU load job $i"
}

# Memory Load Generator  
$memoryJob = Start-Job -ScriptBlock {
    $arrays = @()
    $endTime = (Get-Date).AddMinutes(5)
    while ((Get-Date) -lt $endTime) {
        $array = New-Object byte[] 10MB
        $arrays += $array
        Start-Sleep 2
        if ($arrays.Count -gt 20) {
            $arrays = $arrays[10..19]  # Keep only last 10
        }
    }
}

Write-Host "✅ Load generation started! This will run for 5 minutes."
Write-Host "📊 Check your Grafana dashboard at: http://127.0.0.1:64034"
Write-Host "🔍 You should see increased CPU, Memory, and Network activity!"

# Web Traffic Generator
Write-Host "🌐 Generating web traffic..."
for ($i = 1; $i -le 50; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Out-Null
        Write-Host "Web request $i sent"
        Start-Sleep 1
    } catch {
        Write-Host "Request $i failed, continuing..."
    }
}

Write-Host "🎯 Demo load generation complete!"