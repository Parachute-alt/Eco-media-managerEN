
// Convert bytes to KB
function formatSize(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

// Simple estimate: 1 MB ≈ 0.5g CO₂ (indicative value)
function estimateCO2Saved(originalBytes, compressedBytes) {
  const originalMB = originalBytes / (1024 * 1024);
  const compressedMB = compressedBytes / (1024 * 1024);
  const savedMB = Math.max(0, originalMB - compressedMB);
  const savedGrams = savedMB * 0.5;
  return savedGrams.toFixed(2) + ' g';
}

// Compress to WebP using canvas
function compressImageToWebp(file, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const format = 'image/webp';
      const extension = 'webp';
      const quality = 0.8;

      canvas.toBlob(
        function (blob) {
          if (blob) {
            callback(blob, extension);
          } else {
            // Fallback WebP (if blob is null)
            try {
              const dataUrl = canvas.toDataURL(format, quality);
              fetch(dataUrl)
                .then(res => res.blob())
                .then(fallbackBlob => callback(fallbackBlob, extension))
                .catch(() => {
                  alert("Unable to export as WebP. Please try another browser.");
                });
            } catch (err) {
              alert("WebP export error: " + err.message);
            }
          }
        },
        format,
        quality
      );
    };
    img.onerror = function () {
      alert("Error loading image.");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

const imageInput = document.getElementById('imageInput');

imageInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const originalSize = file.size;
  document.getElementById('originalSize').textContent = formatSize(originalSize);

  // Preview image
  const previewImg = document.getElementById('previewImage');
  const readerPreview = new FileReader();
  readerPreview.onload = function (event) {
    previewImg.src = event.target.result;
    previewImg.classList.remove('hidden');
  };
  readerPreview.readAsDataURL(file);

  compressImageToWebp(file, function (compressedBlob, extension) {
    const compressedSize = compressedBlob.size;
    document.getElementById('compressedSize').textContent = formatSize(compressedSize);
    document.getElementById('co2Saved').textContent = estimateCO2Saved(originalSize, compressedSize);

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = URL.createObjectURL(compressedBlob);
    downloadLink.download = 'compressed_' + file.name.replace(/\.[^/.]+$/, '') + '.' + extension;

    document.getElementById('output').classList.remove('hidden');
  });
});
