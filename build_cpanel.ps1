
Write-Host "Building project..."
npm run build

$deployDir = "D:\SmileBaby_Deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

Write-Host "Copying standalone files..."
Copy-Item -Recurse -Force ".next\standalone\*" $deployDir

Write-Host "Copying static assets..."
$staticDir = "$deployDir\.next\static"
New-Item -ItemType Directory -Force -Path $staticDir | Out-Null
Copy-Item -Recurse -Force ".next\static\*" $staticDir

Write-Host "Copying public folder..."
$publicDir = "$deployDir\public"
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
Copy-Item -Recurse -Force "public\*" $publicDir
$uploadsDir = "$deployDir\public\uploads"
if (!(Test-Path $uploadsDir)) { New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null }

Write-Host "Copying database (Prisma)..."
$prismaDir = "$deployDir\prisma"
New-Item -ItemType Directory -Force -Path $prismaDir | Out-Null
Copy-Item -Recurse -Force "prisma\*" $prismaDir
if (Test-Path "prisma\dev.db") { Copy-Item -Force "prisma\dev.db" "$deployDir\dev.db" }

Write-Host "Copying .env file..."
Copy-Item -Force ".env" $deployDir

Write-Host "Patching Next.js standalone server for cPanel (Phusion Passenger)..."
$serverJsPath = "$deployDir\server.js"
(Get-Content $serverJsPath) -replace "parseInt\(\s*process\.env\.PORT\s*,\s*10\s*\)", "process.env.PORT" | Set-Content $serverJsPath

Write-Host "Patching Prisma DATABASE_URL for standalone mode..."
$envPath = "$deployDir\.env"
(Get-Content $envPath) -replace "file:\./dev.db", "file:../../../prisma/dev.db" | Set-Content $envPath

Write-Host "Zipping the deployment folder..."
$zipPath = "D:\SmileBaby_Deploy.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath

Write-Host "Deployment package ready at $zipPath"

