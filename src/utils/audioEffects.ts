export class RadioStaticGenerator {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private fadeInterval: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    try {
      this.audioElement = new Audio('/radio-static.mp3');
      this.audioElement.loop = true;
      this.audioElement.volume = 0;
      this.audioElement.preload = 'auto';
      
      // Load the audio file
      await new Promise((resolve, reject) => {
        this.audioElement!.addEventListener('canplaythrough', resolve, { once: true });
        this.audioElement!.addEventListener('error', reject, { once: true });
        this.audioElement!.load();
      });
    } catch (error) {
      console.warn('Failed to initialize static audio file:', error);
    }
  }

  async playStatic(volume: number = 0.15): Promise<void> {
    if (!this.audioElement || this.isPlaying) return;

    try {
      this.audioElement.currentTime = 0;
      this.audioElement.volume = 0;
      
      // Start playing
      await this.audioElement.play();
      this.isPlaying = true;

      // Fade in the static
      this.fadeIn(volume);

      // Auto-stop after 10 seconds as a safety measure
      setTimeout(() => {
        if (this.isPlaying) {
          this.stopStatic();
        }
      }, 10000);
      
    } catch (error) {
      console.warn('Failed to play static:', error);
    }
  }

  async stopStatic(): Promise<void> {
    if (!this.audioElement || !this.isPlaying) return;

    try {
      // Fade out the static
      this.fadeOut();
      
    } catch (error) {
      console.warn('Failed to stop static:', error);
    }
  }

  private fadeIn(targetVolume: number): void {
    if (!this.audioElement) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const steps = 10;
    const stepSize = targetVolume / steps;
    const stepDuration = 100; // 100ms per step = 1 second total fade in
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      if (!this.audioElement || currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        return;
      }

      currentStep++;
      this.audioElement.volume = Math.min(stepSize * currentStep, targetVolume);
    }, stepDuration);
  }

  private fadeOut(): void {
    if (!this.audioElement) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const steps = 8;
    const currentVolume = this.audioElement.volume;
    const stepSize = currentVolume / steps;
    const stepDuration = 50; // 50ms per step = 400ms total fade out
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      if (!this.audioElement || currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        
        // Stop playback and reset
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
          this.audioElement.volume = 0;
        }
        this.isPlaying = false;
        return;
      }

      currentStep++;
      this.audioElement.volume = Math.max(currentVolume - (stepSize * currentStep), 0);
    }, stepDuration);
  }

  setVolume(volume: number): void {
    if (this.audioElement && this.isPlaying) {
      // Only adjust if currently playing, maintain the current relative volume
      const currentVolume = this.audioElement.volume;
      if (currentVolume > 0) {
        this.audioElement.volume = volume;
      }
    }
  }

  cleanup(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.isPlaying) {
      this.stopStatic();
    }
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}