type CompressOptions = { maxWidth?: number; maxHeight?: number; quality?: number };

const DEFAULTS = { maxWidth: 960, maxHeight: 640, quality: 0.72 };

/** Thrown when the browser cannot decode the file (HEIC, corrupt, or not an image). */
export class ImageDecodeError extends Error {
  constructor() {
    super("Failed to decode image");
    this.name = "ImageDecodeError";
  }
}

function renderToCanvas(file: File, options?: CompressOptions): Promise<HTMLCanvasElement> {
  const maxWidth = options?.maxWidth ?? DEFAULTS.maxWidth;
  const maxHeight = options?.maxHeight ?? DEFAULTS.maxHeight;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageDecodeError());
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new ImageDecodeError());
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Compress an image file to a JPEG data URL suitable for station photo storage. */
export async function compressImageFile(file: File, options?: CompressOptions): Promise<string> {
  const canvas = await renderToCanvas(file, options);
  return canvas.toDataURL("image/jpeg", options?.quality ?? DEFAULTS.quality);
}

/**
 * Compress to a JPEG upload payload. Phone photos run 3-10 MB, which the API
 * rejects outright, so resizing here is what makes camera uploads work at all.
 */
export async function compressImageToUpload(file: File, options?: CompressOptions): Promise<File> {
  const canvas = await renderToCanvas(file, options);
  const quality = options?.quality ?? DEFAULTS.quality;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  if (!blob) throw new ImageDecodeError();

  const name = file.name.replace(/\.[^.]+$/, "") || "station";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
