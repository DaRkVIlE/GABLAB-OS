// ══ SOLO LEVELING SYSTEM VOICE SYNTHESIZER ══
// Web Speech API nativa — Zero dependências externas, latência ultrabaixa

class SystemVoiceEngine {
  private enabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer Portuguese Brazilian voices, preferably deeper or Google/Microsoft ones
    const ptVoices = voices.filter(v => v.lang.startsWith("pt"));
    this.selectedVoice = ptVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("antonio") || v.name.toLowerCase().includes("daniel")) || ptVoices[0] || voices[0] || null;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.enabled && !force) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech

      // Clean markdown, brackets or tags before speaking
      const cleanText = text
        .replace(/[*_#`~\[\]]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, "")
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.lang = "pt-BR";
      utterance.pitch = 0.82; // Deeper, more authoritative system tone
      utterance.rate = 1.05;  // Slightly crisp and military-cadenced
      utterance.volume = 0.95;

      utterance.onstart = () => { this.isSpeaking = true; };
      utterance.onend = () => { this.isSpeaking = false; };
      utterance.onerror = () => { this.isSpeaking = false; };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech blocked by browser permissions until user interaction
    }
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    return this.enabled;
  }

  public isVoiceEnabled(): boolean {
    return this.enabled;
  }

  public setVoiceEnabled(state: boolean): void {
    this.enabled = state;
    if (!state) this.stop();
  }
}

export const systemVoice = new SystemVoiceEngine();
