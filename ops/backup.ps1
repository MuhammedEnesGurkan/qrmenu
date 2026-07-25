param([Parameter(Mandatory=$true)][string]$BackupDirectory)
$ErrorActionPreference = "Stop"
if (-not $env:BACKUP_PGSERVICE) { throw "BACKUP_PGSERVICE is required (credentials belong in pg_service.conf/PGPASSFILE)." }
if (-not $env:BACKUP_AGE_RECIPIENT) { throw "BACKUP_AGE_RECIPIENT is required." }
foreach ($tool in @("pg_dump","age")) { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is required." } }
$root = [System.IO.Path]::GetFullPath($BackupDirectory)
New-Item -ItemType Directory -Path $root -Force | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$output = [System.IO.Path]::GetFullPath((Join-Path $root "masaakis-$stamp.dump.age"))
if (-not $output.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)) { throw "Output escaped backup directory." }
$temporary = New-TemporaryFile
try {
  & pg_dump "--dbname=service=$($env:BACKUP_PGSERVICE)" "--format=custom" "--no-owner" "--no-acl" "--file=$($temporary.FullName)"
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
  & age "--recipient=$($env:BACKUP_AGE_RECIPIENT)" "--output=$output" $temporary.FullName
  if ($LASTEXITCODE -ne 0) { throw "age encryption failed." }
  $hash = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
  @{file=[System.IO.Path]::GetFileName($output);sha256=$hash;createdAt=$stamp;format="pg_dump-custom+age"} |
    ConvertTo-Json | Set-Content -LiteralPath "$output.json" -Encoding utf8NoBOM
  Write-Output $output
} finally {
  if (Test-Path -LiteralPath $temporary.FullName) { Remove-Item -LiteralPath $temporary.FullName -Force }
}
