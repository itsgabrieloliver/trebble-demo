// Stand-in music data used until a listener connects Spotify, plus the sample
// friend activity that seeds the activity feed. Ported unchanged.

export const MOCK_TRACKS = [
	{ title: 'Midnight City', artist: 'M83', art: 'https://picsum.photos/seed/midnightcity/300/300' },
	{ title: 'Redbone', artist: 'Childish Gambino', art: 'https://picsum.photos/seed/redbone/300/300' },
	{ title: 'Nights', artist: 'Frank Ocean', art: 'https://picsum.photos/seed/nights/300/300' },
	{ title: 'Weekend', artist: 'Mac DeMarco', art: 'https://picsum.photos/seed/weekend/300/300' },
	{ title: 'Silver Springs', artist: 'Fleetwood Mac', art: 'https://picsum.photos/seed/silverspr/300/300' },
	{ title: 'Sundress', artist: 'A$AP Rocky', art: 'https://picsum.photos/seed/sundress/300/300' },
	{ title: 'Space Song', artist: 'Beach House', art: 'https://picsum.photos/seed/spacesong/300/300' },
	{ title: 'Just', artist: 'Radiohead', art: 'https://picsum.photos/seed/just/300/300' }
];

export const MOCK_FRIENDS = [
	{
		name: 'Priya Shah',
		avatar: 'https://i.pravatar.cc/80?img=47',
		kind: 'recommend',
		title: 'Cold Little Heart',
		artist: 'Michael Kiwanuka',
		art: 'https://picsum.photos/seed/coldheart/300/300',
		note: 'Eight minute intro is worth it, trust me.',
		minutesAgo: 12
	},
	{
		name: 'Diego Fuentes',
		avatar: 'https://i.pravatar.cc/80?img=12',
		kind: 'played',
		title: 'Alright',
		artist: 'Kendrick Lamar',
		art: 'https://picsum.photos/seed/alrightklamar/300/300',
		minutesAgo: 34
	},
	{
		name: 'Ines Novak',
		avatar: 'https://i.pravatar.cc/80?img=32',
		kind: 'recommend',
		title: 'Liability',
		artist: 'Lorde',
		art: 'https://picsum.photos/seed/liability/300/300',
		note: 'On repeat all week, the bridge kills me.',
		minutesAgo: 58
	},
	{
		name: 'Sam Okafor',
		avatar: 'https://i.pravatar.cc/80?img=15',
		kind: 'played',
		title: 'Time (You and I)',
		artist: 'Khruangbin',
		art: 'https://picsum.photos/seed/khruangbintime/300/300',
		minutesAgo: 96
	},
	{
		name: 'Lena Petrova',
		avatar: 'https://i.pravatar.cc/80?img=41',
		kind: 'recommend',
		title: 'Cherry Wine',
		artist: 'Hozier',
		art: 'https://picsum.photos/seed/cherrywine/300/300',
		note: 'Perfect for a slow Sunday, thank me later.',
		minutesAgo: 140
	},
	{
		name: 'Marcus Webb',
		avatar: 'https://i.pravatar.cc/80?img=53',
		kind: 'played',
		title: 'Feel It Still',
		artist: 'Portugal. The Man',
		art: 'https://picsum.photos/seed/feelitstill/300/300',
		minutesAgo: 210
	}
];
