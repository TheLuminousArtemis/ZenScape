class MusicService {
    private sound: Audio.Sound | null = null;
    private currentTrack: MusicTrack | null = null;
    private isPlaying: boolean = false;
    private isMuted: boolean = false;
    private cachedSound: Audio.Sound | null = null;
    private isLoading: boolean = false;

    async loadTrack(track: MusicTrack): Promise<void> {
        if (this.isLoading || this.isPlaying) {
            console.log('Track is already loading or playing');
            return;
        }

        try {
            this.isLoading = true;
            // Stop any existing playback
            await this.stopPlayback();

            console.log('Loading music track:', track.url);

            // Check if we have a cached sound
            let sound = this.cachedSound;

            if (!sound) {
                // Load the sound if not cached
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: track.url },
                    {
                        shouldPlay: false,
                        isLooping: true,
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
                    await sound.setIsLoopingAsync(true);
                    await sound.setVolumeAsync(0.1); // Reset to lower volume
                } catch (error) {
                    console.log('Error resetting sound state:', error);
                }
            }

            this.sound = sound;
            this.currentTrack = track;
            this.isMuted = false;
        } catch (error) {
            console.error('Error loading music track:', error);
            throw error;
        } finally {
            this.isLoading = false;
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
        } catch (error) {
            console.error('Error starting music playback:', error);
            this.isPlaying = false;
            throw error;
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
                this.isMuted = false;
            } catch (error) {
                console.error('Error stopping music playback:', error);
            }
        }
    }

    isTrackMuted(): boolean {
        return this.isMuted;
    }
}

export const musicService = new MusicService(); 