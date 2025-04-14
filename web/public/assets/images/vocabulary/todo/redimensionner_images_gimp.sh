#!/bin/bash

# Répertoire contenant les images (à adapter si besoin)
IMG_DIR="todo"

# Vérifie que le dossier existe
if [ ! -d "$IMG_DIR" ]; then
  echo "Dossier $IMG_DIR introuvable"
  exit 1
fi

# Script GIMP embarqué en mode batch
for img in "$IMG_DIR"/*.webp; do
  echo "🖼️ Redimensionnement de $img"
  gimp -i -b "(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE \"$img\" \"$img\"))) 
              (drawable (car (gimp-image-get-active-layer image))))
              (gimp-image-scale image 200 200)
              (file-png-save RUN-NONINTERACTIVE image drawable \"$img\" \"$img\" 0 9 1 1 1 1 1)
              (gimp-image-delete image))" -b "(gimp-quit 0)"
done
