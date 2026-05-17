const DATA_URL_PREFIX = "data:";

function detectMimeTypeFromBytes(binaryString) {
    if (!binaryString) {
        return null;
    }

    if (binaryString.startsWith("\xFF\xD8\xFF")) {
        return "image/jpeg";
    }

    if (binaryString.startsWith("\x89PNG\r\n\x1A\n")) {
        return "image/png";
    }

    if (binaryString.startsWith("GIF8")) {
        return "image/gif";
    }

    if (binaryString.startsWith("RIFF") && binaryString.slice(8, 12) === "WEBP") {
        return "image/webp";
    }

    if (binaryString.startsWith("BM")) {
        return "image/bmp";
    }

    return null;
}

export function sanitizeImageSrc(imageValue) {
    if (typeof imageValue !== "string") {
        return null;
    }

    const trimmed = imageValue.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("/")) {
        return trimmed;
    }

    const rawPayload = trimmed.startsWith(DATA_URL_PREFIX)
        ? trimmed.split(",", 2)[1]
        : trimmed;

    if (!rawPayload) {
        return null;
    }

    try {
        const cleanedPayload = decodeURIComponent(rawPayload)
            .replace(/\uFEFF/g, "")
            .replace(/\s+/g, "");

        const binary = atob(cleanedPayload);
        const mimeType = detectMimeTypeFromBytes(binary);

        if (!mimeType) {
            return null;
        }

        return `data:${mimeType};base64,${cleanedPayload}`;
    } catch {
        return null;
    }
}
