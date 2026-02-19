$baseUri = "http://localhost:3001"
$credentials = @{
    email    = "test@example.com"
    password = "password123"
    name     = "Test User"
}

# 1. Register or Login
Write-Host "Attempting registration..."
try {
    $regResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/register" -Method Post -Body ($credentials | ConvertTo-Json) -ContentType "application/json"
    $token = $regResponse.token
    Write-Host "Registration successful. Token acquired."
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "User already exists. Logging in..."
        try {
            $loginResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/login" -Method Post -Body ($credentials | ConvertTo-Json) -ContentType "application/json"
            $token = $loginResponse.token
            Write-Host "Login successful. Token acquired."
        }
        catch {
            Write-Host "Login failed: $_"
            exit
        }
    }
    else {
        Write-Host "Registration failed: $_"
        exit
    }
}

# 2. Strategy Analysis
Write-Host "Calling strategy analysis..."
$strategyRequest = @{
    brandName   = "EcoClean"
    sector      = "Limpieza Ecológica"
    competitors = "https://example.com"
    country     = "Chile"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUri/api/strategy/analyze" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body ($strategyRequest | ConvertTo-Json) -ContentType "application/json"
    Write-Host "`nSuccess!"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Strategy analysis failed: $_"
    # Print error details if available
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host $reader.ReadToEnd()
    }
    catch {
        Write-Host "No detailed error message."
    }
}
