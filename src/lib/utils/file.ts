/**
 * Generic utility to download a file from a URL.
 * Handles CloudFront/S3 URLs by fetching as a blob via a proxy to force download.
 */
export async function downloadFile(url: string, title: string): Promise<void> {
    if (!url) return;

    try {
        // Use a generic proxy name to bypass cross-origin restrictions
        const proxyUrl = url.replace('https://dru7up4h3zrl.cloudfront.net', '/cdn-download');
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to fetch file');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        // Try to get extension from URL or content-type
        let extension = '';
        try {
            const urlPath = new URL(url).pathname;
            const extMatch = urlPath.match(/\.([a-z0-9]+)$/i);
            if (extMatch) extension = extMatch[1];
        } catch (e) { }

        if (!extension) {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('pdf')) extension = 'pdf';
            else if (contentType?.includes('image/png')) extension = 'png';
            else if (contentType?.includes('image/jpeg')) extension = 'jpg';
        }

        const fileName = extension ? `${title}.${extension}` : title;

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        // Fallback to opening in new tab if blob download fails
        console.error('Download failed, falling back to window.open', error);
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
