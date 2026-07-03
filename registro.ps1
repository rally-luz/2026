param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet("abierto", "cerrado")]
  [string]$Estado,

  [switch]$Publicar
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$origen = Join-Path $repo "index_$Estado.html"
$destino = Join-Path $repo "index.html"
$git = "C:\Program Files\Git\cmd\git.exe"

if (-not (Test-Path -LiteralPath $origen)) {
  throw "No existe la plantilla: $origen"
}

Copy-Item -LiteralPath $origen -Destination $destino -Force
Write-Host "Registro $Estado aplicado en index.html"

if ($Publicar) {
  if (-not (Test-Path -LiteralPath $git)) {
    $git = "git"
  }

  Push-Location $repo
  try {
    & $git add index.html
    $mensaje = if ($Estado -eq "abierto") { "Abre registro" } else { "Cierra registro" }

    $status = & $git status --short index.html
    if ($status) {
      & $git commit -m $mensaje
      & $git push
      Write-Host "Cambio publicado en GitHub."
    } else {
      Write-Host "No hay cambios por publicar."
    }
  } finally {
    Pop-Location
  }
}
