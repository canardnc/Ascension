#!/bin/bash

# Répertoire contenant les images d'entrée
IMG_DIR="./todo"

# Répertoire de sortie
OUT_DIR="./output"
mkdir -p "$OUT_DIR"

# Vérifie que le dossier existe
if [ ! -d "$IMG_DIR" ]; then
  echo "Dossier $IMG_DIR introuvable"
  exit 1
fi

# Boucle sur chaque image PNG
for img in "$IMG_DIR"/*.webp; do
  filename=$(basename "$img" .png)
  output="$OUT_DIR/${filename}.webp"

  echo "🖼️ Redimensionnement + compression de $img → $output"

  gimp -i -b "(let* (
    (image (car (gimp-file-load RUN-NONINTERACTIVE \"$img\" \"$img\")))
    (drawable (car (gimp-image-get-active-layer image)))
  )
    (gimp-image-scale image 200 200)
    (file-webp-save RUN-NONINTERACTIVE image drawable \"$output\" \"$output\" FALSE 90 6 0 1 1 FALSE)
    (gimp-image-delete image)
  )" -b "(gimp-quit 0)"
done
