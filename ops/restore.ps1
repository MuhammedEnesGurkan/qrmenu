param([Parameter(Mandatory=$true)][string]$EncryptedBackup)
$ErrorActionPreference = "Stop"
if ($env:RESTORE_CONFIRMATION -ne "RESTORE_ISOLATED_DATABASE") { throw "Set RESTORE_CONFIRMATION=RESTORE_ISOLATED_DATABASE." }
if (-not $env:RESTORE_PGSERVICE) { throw "RESTORE_PGSERVICE is required and must target an isolated empty database." }
foreach ($tool in @("pg_restore","age")) { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is required." } }
$source = (Resolve-Path -LiteralPath $EncryptedBackup).Path
if (-not $source.EndsWith(".dump.age",[System.StringComparison]::OrdinalIgnoreCase)) { throw "Expected a .dump.age file." }
$manifest = "$source.json"
if (Test-Path -LiteralPath $manifest) {
  $expected = (Get-Content -Raw -LiteralPath $manifest | ConvertFrom-Json).sha256
  $actual = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "Backup checksum mismatch." }
}
$temporary = New-TemporaryFile
try {
  & age "--decrypt" "--output=$($temporary.FullName)" $source
  if ($LASTEXITCODE -ne 0) { throw "age decryption failed." }
  & pg_restore "--dbname=service=$($env:RESTORE_PGSERVICE)" "--clean" "--if-exists" "--no-owner" "--no-acl" "--exit-on-error" $temporary.FullName
  if ($LASTEXITCODE -ne 0) { throw "pg_restore failed." }
  Write-Output "Restore completed; run Flyway/version, RLS, asset and smoke checks from docs/operations.md."
} finally {
  if (Test-Path -LiteralPath $temporary.FullName) { Remove-Item -LiteralPath $temporary.FullName -Force }
}
