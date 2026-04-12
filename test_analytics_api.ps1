# Test Analytics API endpoints

Write-Host "Testing Analytics API..." -ForegroundColor Cyan

# Test 1: Record a visit
Write-Host "`n1. POST /api/customer-visits (record visit)" -ForegroundColor Yellow
$body1 = @{
    customer_id = 1
    restaurant_id = 7
    listen_count = 0
} | ConvertTo-Json

$response1 = Invoke-WebRequest -Uri "http://localhost:3000/api/customer-visits" `
    -Method Post `
    -Body $body1 `
    -ContentType "application/json" `
    -UseBasicParsing 2>&1

Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
Write-Host "Response: $($response1.Content)" -ForegroundColor Green

# Test 2: Record an audio listen
Write-Host "`n2. POST /api/customer-visits (record audio listen)" -ForegroundColor Yellow
$body2 = @{
    customer_id = 2
    restaurant_id = 7
    listen_count = 1
} | ConvertTo-Json

$response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/customer-visits" `
    -Method Post `
    -Body $body2 `
    -ContentType "application/json" `
    -UseBasicParsing 2>&1

Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
Write-Host "Response: $($response2.Content)" -ForegroundColor Green

# Test 3: Get stats for restaurant 7
Write-Host "`n3. GET /api/restaurants/7/visits/stats" -ForegroundColor Yellow
$response3 = Invoke-WebRequest -Uri "http://localhost:3000/api/restaurants/7/visits/stats" `
    -Method Get `
    -UseBasicParsing 2>&1

Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
$stats = $response3.Content | ConvertFrom-Json
Write-Host "Stats: $($stats | ConvertTo-Json)" -ForegroundColor Green

# Test 4: Check if data was inserted in database
Write-Host "`n4. Checking database record..." -ForegroundColor Yellow
$dbCheck = & "d:\xampp\mysql\bin\mysql.exe" -u root food_app -e "SELECT * FROM customer_visited WHERE restaurant_id = 7 ORDER BY visit_id DESC LIMIT 1;" 2>&1
Write-Host $dbCheck -ForegroundColor Green

Write-Host "`n✅ All tests completed!" -ForegroundColor Cyan
