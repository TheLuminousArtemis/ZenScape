export interface Track {
    id: string;
    title: string;
    category: 'hertz' | 'ambient';
    duration: number;
}

export const SAMPLE_TRACKS: Track[] = [
    // Frequency tracks
    {
        id: '1',
        title: '432 Hz - Deep Healing',
        category: 'hertz',
        duration: 605 // 10:05 in seconds
    },
    {
        id: '2',
        title: '528 Hz - Miracle Tone',
        category: 'hertz',
        duration: 600 // 10:00 in seconds
    },
    {
        id: '3',
        title: '639 Hz - Heart Chakra',
        category: 'hertz',
        duration: 600 // 10:00 in seconds
    },

    // Ambient tracks
    {
        id: 'fireplace',
        title: 'Crackling Fireplace',
        category: 'ambient',
        duration: 170 // 2:50 in seconds
    },
    {
        id: 'crickets',
        title: 'Crickets at Night',
        category: 'ambient',
        duration: 208 // 3:28 in seconds
    },
    {
        id: 'stream',
        title: 'Mountain Stream',
        category: 'ambient',
        duration: 42 // 42 seconds
    },
    {
        id: 'waves',
        title: 'Ocean Waves',
        category: 'ambient',
        duration: 104 // 1:44 in seconds
    },
    {
        id: 'rainforest',
        title: 'Rainforest Ambience',
        category: 'ambient',
        duration: 593 // 9:53 in seconds
    },
    {
        id: 'rain',
        title: 'Rain Sounds',
        category: 'ambient',
        duration: 108 // 1:48 in seconds
    }
]; 