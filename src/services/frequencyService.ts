import { Platform } from 'react-native';

export interface FrequencyTrack {
    id: string;
    name: string;
    frequency: number;
    description: string;
    youtubeId: string;
    url: string; // URL to the audio file in Supabase
    duration: number; // in seconds
}

export const FREQUENCY_TRACKS: FrequencyTrack[] = [
    {
        id: '432hz',
        name: '432 Hz Healing Frequency',
        frequency: 432,
        description: 'Known for its healing properties and alignment with the natural world.',
        youtubeId: 'eWLVBP3VrO4',
        url: 'https://your-supabase-bucket-url/432hz.mp3',
        duration: 21600, // 6 hours
    },
    {
        id: '639hz',
        name: '639 Hz Love Frequency',
        frequency: 639,
        description: 'Connects and heals relationships, family bonds and community.',
        youtubeId: 'DCer1x6QJZY',
        url: 'https://your-supabase-bucket-url/639hz.mp3',
        duration: 21600, // 6 hours
    },
    {
        id: '528hz',
        name: '528 Hz Miracle Frequency',
        frequency: 528,
        description: 'DNA repair and positive transformation.',
        youtubeId: '1MPRbX7ACh8',
        url: 'https://your-supabase-bucket-url/528hz.mp3',
        duration: 21600, // 6 hours
    },
];

export const getFrequencyTracks = () => FREQUENCY_TRACKS;

export const getFrequencyTrackById = (id: string) =>
    FREQUENCY_TRACKS.find(track => track.id === id);

// Extract YouTube ID from various YouTube URL formats
export const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Convert seconds to human readable duration
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 