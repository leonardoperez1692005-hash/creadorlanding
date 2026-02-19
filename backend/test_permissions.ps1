# Test Script - Fase 3: Verificación de Permisos y Restricciones
# StaticLaunch - Sistema de Planes

$baseUri = "http://localhost:3001"

# =============================================
# 1. TEST: Login y verificar membership
# =============================================
Write-Host "`n=== TEST 1: Login y Membership ===" -ForegroundColor Cyan

$credentials = @{
    email    = "admin@staticlaunch.com"
    password = "admin123"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/login" -Method Post -Body ($credentials | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResponse.token
    
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.email)"
    Write-Host "   Role: $($loginResponse.user.role)"
    
    if ($loginResponse.user.membership) {
        Write-Host "   Membership: $($loginResponse.user.membership.status)"
        Write-Host "   Plan: $($loginResponse.user.membership.plan.name)"
        Write-Host "   Features: $($loginResponse.user.membership.plan.features)"
        Write-Host "   Max Projects: $($loginResponse.user.membership.plan.maxProjects)"
        Write-Host "   Max AI Analysis: $($loginResponse.user.membership.plan.maxAIAnalysis)"
    }
    else {
        Write-Host "⚠️ Sin membership" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Login falló: $_" -ForegroundColor Red
    exit 1
}

# =============================================
# 2. TEST: Obtener /me con membership
# =============================================
Write-Host "`n=== TEST 2: GET /me ===" -ForegroundColor Cyan

try {
    $meResponse = Invoke-RestMethod -Uri "$baseUri/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
    
    if ($meResponse.user.membership) {
        Write-Host "✅ /me retorna membership" -ForegroundColor Green
    }
    else {
        Write-Host "❌ /me no retorna membership" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error en /me: $_" -ForegroundColor Red
}

# =============================================
# 3. TEST: Crear proyecto (dentro del límite)
# =============================================
Write-Host "`n=== TEST 3: Crear proyecto (Dentro del límite) ===" -ForegroundColor Cyan

$newProject = @{
    name          = "Test Project $(Get-Random)"
    structureType = "vsl"
    visualModel   = "dark"
}

try {
    $projectResponse = Invoke-RestMethod -Uri "$baseUri/api/projects" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body ($newProject | ConvertTo-Json) -ContentType "application/json"
    $projectId = $projectResponse.project.id
    Write-Host "✅ Proyecto creado: ID $projectId" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Error creando proyecto (Status: $statusCode)" -ForegroundColor Red
    Write-Host "   Error: $_"
}

# =============================================
# 4. TEST: Listar proyectos
# =============================================
Write-Host "`n=== TEST 4: Listar proyectos ===" -ForegroundColor Cyan

try {
    $projectsResponse = Invoke-RestMethod -Uri "$baseUri/api/projects" -Method Get -Headers @{ Authorization = "Bearer $token" }
    $projectCount = $projectsResponse.projects.Count
    Write-Host "✅ Proyectos totales: $projectCount" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error listando proyectos: $_" -ForegroundColor Red
}

# =============================================
# 5. TEST: Verificar endpoints de admin
# =============================================
Write-Host "`n=== TEST 5: Endpoints de Admin ===" -ForegroundColor Cyan

# Stats
try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUri/api/admin/stats" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "✅ Admin stats: Users=$($statsResponse.totalUsers), Projects=$($statsResponse.totalProjects)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error en admin/stats: $_" -ForegroundColor Red
}

# Plans
try {
    $plansResponse = Invoke-RestMethod -Uri "$baseUri/api/admin/plans" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "✅ Planes disponibles:" -ForegroundColor Green
    $plansResponse.plans | ForEach-Object {
        Write-Host "   - $($_.name): maxProjects=$($_.maxProjects), maxAI=$($_.maxAIAnalysis), features=$($_.features)"
    }
}
catch {
    Write-Host "❌ Error en admin/plans: $_" -ForegroundColor Red
}

# =============================================
# 6. TEST: Verificar estrategia (ZentrixOs)
# =============================================
Write-Host "`n=== TEST 6: ZentrixOs /strategy ===" -ForegroundColor Cyan

$strategyRequest = @{
    brandName   = "Test Brand"
    sector      = "Test Sector"
    competitors = "https://example.com"
    country     = "Argentina"
}

try {
    $strategyResponse = Invoke-RestMethod -Uri "$baseUri/api/strategy/analyze" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body ($strategyRequest | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Análisis de estrategia exitoso" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️ Estrategia (Status: $statusCode)" -ForegroundColor Yellow
    Write-Host "   Error: $_"
}

# =============================================
# RESUMEN
# =============================================
Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Tests completados. Verificar:" -ForegroundColor White
Write-Host "  1. Login retorna membership y plan" -ForegroundColor White
Write-Host "  2. /me retorna membership" -ForegroundColor White
Write-Host "  3. Proyectos se crean correctamente" -ForegroundColor White
Write-Host "  4. Admin/stats funciona" -ForegroundColor White
Write-Host "  5. Admin/plans muestra los planes" -ForegroundColor White
Write-Host "  6. ZentrixOs funciona o retorna error según plan" -ForegroundColor White
