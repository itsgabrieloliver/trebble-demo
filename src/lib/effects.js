// Effect presets applied to post media at render time. Each is a pure
// CSS treatment (filter + optional overlay + optional animation), so the
// uploaded file is stored untouched and the effect is just an id on the post.

export const EFFECTS = [
	{ id: 'none', label: 'None', hint: 'The media as shot' },
	{ id: 'grain', label: 'Grain', hint: 'Film grain and slight warmth' },
	{ id: 'vhs', label: 'VHS', hint: 'Scanlines, chroma shift, tape softness' },
	{ id: 'duotone', label: 'Duotone', hint: 'Shadow black to gold tint' },
	{ id: 'glow', label: 'Glow', hint: 'Lifted brightness with a soft bloom' },
	{ id: 'blur-frame', label: 'Blur frame', hint: 'Sharp center, blurred edge vignette' },
	{ id: 'beat-pulse', label: 'Beat pulse', hint: 'Subtle scale and brightness pulse' }
];

const IDS = new Set(EFFECTS.map((e) => e.id));

export function isEffect(id) {
	return IDS.has(id);
}

export function normalizeEffect(id) {
	return isEffect(id) ? id : 'none';
}
