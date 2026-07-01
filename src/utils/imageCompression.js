// Shared image-compression pipeline used by ImageItem and QuestionItem.
// Resizes large images down and re-encodes as JPEG to keep base64 payloads
// well under Firestore's 1 MB per-document limit.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;   // reject raw files larger than 5 MB
export const MAX_BASE64_BYTES = 800000;            // ~800 KB per-image base64 cap (headroom for the 1 MB doc limit)

/**
 * Compress an image File into a JPEG Blob via an offscreen canvas.
 * Downscales to `maxWidth` (preserving aspect ratio) and applies JPEG `quality`.
 * @returns {Promise<Blob>}
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7, mimeType = 'image/jpeg') =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('ไม่สามารถบีบอัดรูปภาพได้ (canvas ไม่พร้อมใช้งาน)'));
                return;
            }
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('ไม่สามารถบีบอัดรูปภาพได้'))),
                mimeType,
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('ไฟล์รูปภาพไม่ถูกต้อง'));
        };
        img.src = url;
    });

const blobToDataURL = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'));
        reader.readAsDataURL(blob);
    });

/**
 * Full upload pipeline: validate file size → compress → base64 → validate base64 size.
 * Throws an Error with a Thai-friendly message on any failure so the caller can
 * surface it directly in the UI.
 * @returns {Promise<string>} a base64 data URL safe to store in a Firestore doc
 */
export const fileToCompressedDataURL = async (file, { maxWidth = 800, quality = 0.7 } = {}) => {
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('รูปภาพใหญ่เกินไป (สูงสุด 5MB)');
    }
    const blob = await compressImage(file, maxWidth, quality);
    const dataUrl = await blobToDataURL(blob);
    if (dataUrl.length > MAX_BASE64_BYTES) {
        throw new Error('รูปภาพยังใหญ่เกินไปหลังบีบอัด ลองใช้รูปที่เล็กกว่า');
    }
    return dataUrl;
};

/**
 * Icon-library uploads keep PNG (not JPEG) so logos/stamps with a transparent
 * background don't get a black/white fill baked in. Icons are small graphics,
 * so a smaller max width keeps the base64 payload well under the Firestore cap.
 * @returns {Promise<string>} a base64 data URL safe to store in a Firestore doc
 */
export const fileToIconDataURL = async (file, { maxWidth = 512 } = {}) => {
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('ไฟล์ไอคอนใหญ่เกินไป (สูงสุด 5MB)');
    }
    const blob = await compressImage(file, maxWidth, 0.92, 'image/png');
    const dataUrl = await blobToDataURL(blob);
    if (dataUrl.length > MAX_BASE64_BYTES) {
        throw new Error('ไอคอนยังใหญ่เกินไปหลังบีบอัด ลองใช้รูปที่เรียบง่ายกว่านี้');
    }
    return dataUrl;
};
