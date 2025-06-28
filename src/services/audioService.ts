import { Audio } from 'expo-av';

interface AudioTrack {
    id: string;
    title: string;
    category: 'hertz' | 'ambient';
    duration: number;
}

class AudioService {
    private currentTrack: AudioTrack | null = null;
    private sessionDuration: number = 0;
    private elapsedTime: number = 0;
    private timer: NodeJS.Timeout | null = null;
    private onSessionComplete: (() => void) | null = null;
    private sound: Audio.Sound | null = null;
    private isPlaying: boolean = false;
    private isLoading: boolean = false;

    private getTrackInfo(track: AudioTrack): { url: string, duration: number } {
        // Map track IDs to their URLs and durations
        const trackInfo: { [key: string]: { url: string, duration: number } } = {
            // Frequency tracks
            '1': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/frequencies/432-hz-deep-healing.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvZnJlcXVlbmNpZXMvNDMyLWh6LWRlZXAtaGVhbGluZy5tcDMiLCJpYXQiOjE3NDQwNDYzMDMsImV4cCI6MTc3NTU4MjMwM30.Is3kh7lsarg9i4X50LoyE-dggQHEQyxHXJiQjyMwIWg',
                duration: 605 // 10:05 in seconds
            },
            '2': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/frequencies/528-hz-miracle-tone.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvZnJlcXVlbmNpZXMvNTI4LWh6LW1pcmFjbGUtdG9uZS5tcDMiLCJpYXQiOjE3NDQwNDYzMTMsImV4cCI6MTc3NTU4MjMxM30.UGvKJsdJgFqFZpVz7mW14PaFr__ZCUlyzeq27VhPK5g',
                duration: 600 // 10:00 in seconds
            },
            '3': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/frequencies/639-hz-heart-chakra.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvZnJlcXVlbmNpZXMvNjM5LWh6LWhlYXJ0LWNoYWtyYS5tcDMiLCJpYXQiOjE3NDQwNDYzMjAsImV4cCI6MTc3NTU4MjMyMH0.APt979_ay957-NRGVG3UI4bJOzJ4ZwI7ffQaydGsPEQ',
                duration: 600 // 10:00 in seconds
            },

            // Ambient tracks
            'fireplace': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/crackling-fireplace.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9jcmFja2xpbmctZmlyZXBsYWNlLm1wMyIsImlhdCI6MTc0NDA0NjMzMCwiZXhwIjoxNzc1NTgyMzMwfQ.UeaKHoxCuc4G7ZtiS9AZDWH3crHE3sFpqErSlp7tr7A',
                duration: 170 // 2:50 in seconds
            },
            'crickets': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/crickets-at-night.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9jcmlja2V0cy1hdC1uaWdodC5tcDMiLCJpYXQiOjE3NDQwNDYzMzUsImV4cCI6MTc3NTU4MjMzNX0.tc59xw6fBYOLBmS5cLR_CW4MZqJ6S5qsCVTjov-KKVQ',
                duration: 208 // 3:28 in seconds
            },
            'stream': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/mountain-stream.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9tb3VudGFpbi1zdHJlYW0ubXAzIiwiaWF0IjoxNzQ0MDQ2MzQzLCJleHAiOjE3NzU1ODIzNDN9.mRkNx_arFUl1PraSYMlCPlyiUO_HJJ-Z4zHB4ACh6Vc',
                duration: 42 // 42 seconds
            },
            'waves': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/ocean-waves.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9vY2Vhbi13YXZlcy5tcDMiLCJpYXQiOjE3NDQwNDYzNDksImV4cCI6MTc3NTU4MjM0OX0.ik5nlN1ejZcx3ZQhD4Y4neS5G8Pduo-MwzMifkVEcJQ',
                duration: 104 // 1:44 in seconds
            },
            'rainforest': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/rainforest-ambience.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9yYWluZm9yZXN0LWFtYmllbmNlLm1wMyIsImlhdCI6MTc0NDA0NjU0MCwiZXhwIjoxNzc1NTgyNTQwfQ.KuH41Umqk_Jmn0rT96bxzIOhO53A1vs4BHOf_ZFFjS0',
                duration: 593 // 9:53 in seconds
            },
            'rain': {
                url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/ambient/rain-sounds.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvYW1iaWVudC9yYWluLXNvdW5kcy5tcDMiLCJpYXQiOjE3NDQwNDY1MjcsImV4cCI6MTc3NTU4MjUyN30.T_vjctTl-mxg6f4biCPZSIs4gHu6yMsny0zOgIXpUuU',
                duration: 108 // 1:48 in seconds
            }
        };

        const info = trackInfo[track.id];
        if (!info) {
            throw new Error(`No URL found for track: ${track.id}`);
        }
        return info;
    }

    async setup(): Promise<void> {
        // No setup needed for expo-av
    }

    async loadTrack(track: AudioTrack, duration: number): Promise<void> {
        if (this.isLoading || this.isPlaying) {
            console.log('Track is already loading or playing');
            return;
        }

        try {
            this.isLoading = true;
            // Stop any existing playback
            await this.stopPlayback();

            const { url, duration: trackDuration } = this.getTrackInfo(track);
            console.log('Loading audio from:', url);

            // Create and load the sound
            const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: false }
            );
            this.sound = sound;

            this.currentTrack = { ...track, duration: trackDuration };
            this.sessionDuration = duration * 60; // Convert minutes to seconds
            this.elapsedTime = 0;
        } catch (error) {
            console.error('Error loading track:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async startPlayback(): Promise<void> {
        if (!this.currentTrack || !this.sound) return;

        try {
            this.isPlaying = true;
            await this.sound.playAsync();
            this.startTimer();
        } catch (error) {
            console.error('Error starting playback:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    async pausePlayback(): Promise<void> {
        if (!this.sound) return;

        try {
            await this.sound.pauseAsync();
            this.stopTimer();
            this.isPlaying = false;
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }

    async resumePlayback(): Promise<void> {
        if (!this.sound) return;

        try {
            this.isPlaying = true;
            await this.sound.playAsync();
            this.startTimer();
        } catch (error) {
            console.error('Error resuming playback:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    async stopPlayback(): Promise<void> {
        this.stopTimer();
        this.isPlaying = false;

        try {
            if (this.sound) {
                await this.sound.stopAsync();
                await this.sound.unloadAsync();
                this.sound = null;
            }
            this.currentTrack = null;
            this.elapsedTime = 0;
        } catch (error) {
            console.error('Error stopping playback:', error);
        }
    }

    private startTimer(): void {
        if (this.timer) return;

        this.timer = setInterval(() => {
            this.elapsedTime++;

            // Check if session is complete
            if (this.elapsedTime >= this.sessionDuration) {
                this.stopPlayback();
                if (this.onSessionComplete) {
                    this.onSessionComplete();
                }
            }
        }, 1000);
    }

    private stopTimer(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getElapsedTime(): number {
        return this.elapsedTime;
    }

    getRemainingTime(): number {
        return Math.max(0, this.sessionDuration - this.elapsedTime);
    }

    setOnSessionComplete(callback: () => void): void {
        this.onSessionComplete = callback;
    }
}

export const audioService = new AudioService(); 