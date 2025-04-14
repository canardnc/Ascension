(define (batch-resize input output)
  (let* ((image (car (gimp-file-load RUN-NONINTERACTIVE input input)))
         (drawable (car (gimp-image-get-active-layer image))))
    (gimp-image-scale image 200 200)
    (file-webp-save RUN-NONINTERACTIVE image drawable output output 0 9 1 1 1 1 1)
    (gimp-image-delete image)))

