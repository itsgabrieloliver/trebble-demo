// Shared media constraints: imported by both the composer (client) and the
// upload API (server) so the limits can never drift apart.

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_VIDEO_SECONDS = 30;

export function mediaKindOf(mimeType) {
	if (IMAGE_TYPES.includes(mimeType)) return 'image';
	if (VIDEO_TYPES.includes(mimeType)) return 'video';
	return null;
}
