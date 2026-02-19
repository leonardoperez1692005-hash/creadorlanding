
$baseUri = "http://localhost:3001"

$credentials = @{
    email    = "admin@staticlaunch.com"
    password = "admin123"
}

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/login" -Method Post -Body ($credentials | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login OK. Token obtained."

    # Try Upgrade
    $headers = @{ Authorization = "Bearer $token" }
    $body = @{ planSlug = "pro" }
    
    Write-Host "Attempting upgrade to 'pro'..."
    $upgradeResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/upgrade" -Method Post -Headers $headers -Body ($body | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "Upgrade Success!"
    $upgradeResponse | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Upgrade Failed!" -ForegroundColor Red
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
}
