/**
 * Ensures a URL is absolute by prepending https:// if it lacks a protocol.
 */
export function ensureAbsoluteUrl(url: string | undefined): string {
    if (!url) return '';
    
    // Check if it already has a protocol or is a mailto/tel link
    if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
        return url;
    }
    
    // If it starts with //, it's a protocol-relative URL
    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    // Default to https for everything else
    return `https://${url}`;
}
