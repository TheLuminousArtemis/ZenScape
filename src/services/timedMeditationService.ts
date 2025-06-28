import { Audio } from 'expo-av';

interface TimedMeditationTrack {
    id: string;
    title: string;
    duration: number;
    url: string;
}

class TimedMeditationService {
    private sound: Audio.Sound | null = null;
    private currentTrack: TimedMeditationTrack | null = null;
    private sessionDuration: number = 0;
    private elapsedTime: number = 0;
    private timer: NodeJS.Timeout | null = null;
    private onSessionComplete: (() => void) | null = null;
    private isMuted: boolean = false;
    private cachedSound: Audio.Sound | null = null;
    private isPlaying: boolean = false;
    private isLoading: boolean = false;

    private getTrackInfo(): TimedMeditationTrack {
        return {
            id: 'singing-bowl',
            title: 'Himalayan Singing Bowl',
            duration: 801, // 13:21 in seconds
            url: 'https://hwrabnsosvvugrcqoqso.supabase.co/storage/v1/object/sign/audio-tracks/timed/himalayan-singing-bowl.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdWRpby10cmFja3MvdGltZWQvaGltYWxheWFuLXNpbmdpbmctYm93bC5tcDMiLCJpYXQiOjE3NDQwODI2NDEsImV4cCI6MTc3NTYxODY0MX0.l9I-ubLg_jaznn9iSV_FKWMgEZ-POxN3jp6jeGKDZoA'
        };
    }

    async loadTrack(duration: number): Promise<void> {
        if (this.isLoading || this.isPlaying) {
            console.log('Track is already loading or playing');
            return;
        }

        try {
            this.isLoading = true;
            // Stop any existing playback
            await this.stopPlayback();

            const track = this.getTrackInfo();
            console.log('Loading timed meditation track:', track.url);

            // Check if we have a cached sound
            let sound = this.cachedSound;

            if (!sound) {
                // Load the sound if not cached
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: track.url },
                    {
                        shouldPlay: false,
                        isLooping: false,
                        androidImplementation: 'MediaPlayer',
                        iosImplementation: 'AVAudioPlayer',
                        progressUpdateIntervalMillis: 1000,
                        volume: 0.1, // Start with lower volume
                        rate: 1.0,
                        shouldCorrectPitch: true,
                        isMuted: false,
                        is3d: false,
                        pan: 0
                    }
                );
                sound = newSound;
                this.cachedSound = sound;
            } else {
                // If sound is already loaded, just reset its state
                try {
                    await sound.stopAsync();
                    await sound.setPositionAsync(0);
                    await sound.setIsLoopingAsync(false);
                    await sound.setVolumeAsync(0.1); // Reset to lower volume
                } catch (error) {
                    console.log('Error resetting sound state:', error);
                }
            }

            this.sound = sound;
            this.currentTrack = track;
            this.sessionDuration = duration * 60; // Convert minutes to seconds
            this.elapsedTime = 0;
            this.isMuted = false;

            // Set up looping if needed
            await this.sound.setIsLoopingAsync(track.duration < this.sessionDuration);
        } catch (error) {
            console.error('Error loading timed meditation track:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async pausePlayback(): Promise<void> {
        if (!this.sound) return;

        try {
            // Fade out before pausing with smaller steps and longer intervals
            const currentVolume = await this.sound.getStatusAsync();
            if ('volume' in currentVolume) {
                for (let i = currentVolume.volume; i > 0; i -= 0.05) {
                    await this.sound.setVolumeAsync(i);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            await this.sound.pauseAsync();
            this.isPlaying = false;
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }

    async startPlayback(): Promise<void> {
        if (!this.sound || !this.currentTrack) {
            return;
        }

        try {
            this.isPlaying = true;

            // Get current status to check if we're resuming from pause
            const status = await this.sound.getStatusAsync();
            if (status.isLoaded) {
                // If sound is loaded, just resume playback and set volume
                await this.sound.setVolumeAsync(0.8);
                await this.sound.playAsync();
            } else {
                // Start with lower volume and fade in for new playback
                await this.sound.setVolumeAsync(0.1);
                await this.sound.playAsync();

                // Gradually increase volume with smaller steps and longer intervals
                for (let i = 0.1; i <= 0.8; i += 0.05) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await this.sound.setVolumeAsync(i);
                }
            }
            this.startTimer();
        } catch (error) {
            console.error('Error starting timed meditation playback:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    async toggleMute(): Promise<void> {
        if (!this.sound) return;

        try {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                // Fade out when muting with smaller steps and longer intervals
                const currentVolume = await this.sound.getStatusAsync();
                if ('volume' in currentVolume) {
                    for (let i = currentVolume.volume; i > 0; i -= 0.05) {
                        await this.sound.setVolumeAsync(i);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                await this.sound.pauseAsync();
            } else {
                // When unmuting, just set volume and resume playback
                await this.sound.setVolumeAsync(0.8);
                await this.sound.playAsync();
            }
        } catch (error) {
            console.error('Error toggling mute:', error);
            throw error;
        }
    }

    async stopPlayback(): Promise<void> {
        this.stopTimer();
        this.isPlaying = false;

        if (this.sound) {
            try {
                // Fade out with smaller steps and longer intervals
                const currentVolume = await this.sound.getStatusAsync();
                if ('volume' in currentVolume) {
                    for (let i = currentVolume.volume; i > 0; i -= 0.05) {
                        await this.sound.setVolumeAsync(i);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                await this.sound.stopAsync();
                await this.sound.setPositionAsync(0);
                // Don't unload the sound, keep it cached
                this.sound = null;
                this.currentTrack = null;
                this.elapsedTime = 0;
                this.isMuted = false;
            } catch (error) {
                console.error('Error stopping timed meditation playback:', error);
            }
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

    isTrackMuted(): boolean {
        return this.isMuted;
    }

    setOnSessionComplete(callback: () => void): void {
        this.onSessionComplete = callback;
    }
}

export const timedMeditationService = new TimedMeditationService(); 