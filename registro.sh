#!/usr/bin/env bash
set -euo pipefail

estado="${1:-}"
publicar="${2:-}"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$estado" != "abierto" && "$estado" != "cerrado" ]]; then
  echo "Uso: ./registro.sh abierto|cerrado [publicar]"
  exit 1
fi

cp "$repo/index_$estado.html" "$repo/index.html"
echo "Registro $estado aplicado en index.html"

if [[ "$publicar" == "publicar" ]]; then
  cd "$repo"
  git add index.html

  if git diff --cached --quiet -- index.html; then
    echo "No hay cambios por publicar."
  else
    if [[ "$estado" == "abierto" ]]; then
      git commit -m "Abre registro"
    else
      git commit -m "Cierra registro"
    fi
    git push
    echo "Cambio publicado en GitHub."
  fi
fi
