import { supabase } from "../supabase";

// ── Interface ─────────────────────────────────────────────────────

export interface VoiceService {
  startListening(): Promise<void>;
  stopListening(): Promise<string>;
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
  isListening: boolean;
  isSpeaking: boolean;
  cleanup(): void;
}

// ── ElevenLabs implementation ─────────────────────────────────────
// STT: expo-speech-recognition (device-native)
// TTS: ElevenLabs API via edge function proxy

export class ElevenLabsVoiceService implements VoiceService {
  isListening = false;
  isSpeaking = false;
  private sound: any = null;
  private speechRecognition: any = null;
  private resolveTranscript: ((text: string) => void) | null = null;

  async startListening(): Promise<void> {
    try {
      // Dynamically import — package may not be installed yet
      // @ts-ignore optional dependency
      const ExpoSpeechRecognition = await import("expo-speech-recognition");
      const { ExpoSpeechRecognitionModule } = ExpoSpeechRecognition;

      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) throw new Error("Microphone permission not granted");

      this.isListening = true;
      ExpoSpeechRecognitionModule.start({ lang: "en", interimResults: false });
      this.speechRecognition = ExpoSpeechRecognitionModule;
    } catch (err) {
      this.isListening = false;
      throw err;
    }
  }

  async stopListening(): Promise<string> {
    return new Promise(async (resolve) => {
      if (!this.speechRecognition) {
        this.isListening = false;
        resolve("");
        return;
      }

      try {
        // @ts-ignore optional dependency
        const { addSpeechRecognitionListener } = await import("expo-speech-recognition");
        const subscription = addSpeechRecognitionListener("result", (event: any) => {
          const transcript = event.results?.[0]?.transcript ?? "";
          this.isListening = false;
          this.resolveTranscript = null;
          subscription.remove();
          resolve(transcript);
        });

        this.speechRecognition.stop();

        // Timeout fallback
        setTimeout(() => {
          if (this.resolveTranscript) {
            this.isListening = false;
            this.resolveTranscript = null;
            subscription.remove();
            resolve("");
          }
        }, 5000);
      } catch {
        this.isListening = false;
        resolve("");
      }
    });
  }

  async speak(text: string): Promise<void> {
    try {
      this.isSpeaking = true;

      const { data, error } = await supabase.functions.invoke("companion-voice-tts", {
        body: { text },
      });

      if (error) throw error;

      if (data?.audio_base64) {
        const { Audio } = require("expo-av");
        const { sound } = await Audio.Sound.createAsync({
          uri: `data:audio/mpeg;base64,${data.audio_base64}`,
        });
        this.sound = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if ("didJustFinish" in status && status.didJustFinish) {
            this.isSpeaking = false;
          }
        });
        await sound.playAsync();
      }
    } catch (err) {
      this.isSpeaking = false;
      throw err;
    }
  }

  stopSpeaking(): void {
    this.sound?.stopAsync();
    this.isSpeaking = false;
  }

  cleanup(): void {
    this.stopSpeaking();
    this.sound?.unloadAsync();
    this.sound = null;
    this.isListening = false;
  }
}

// ── Vapi implementation ───────────────────────────────────────────
// Full duplex voice agent via Vapi SDK

export class VapiVoiceService implements VoiceService {
  isListening = false;
  isSpeaking = false;
  private vapiClient: any = null;

  async startListening(): Promise<void> {
    try {
      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke(
        "companion-voice-token",
        { body: {} }
      );
      if (tokenErr) throw tokenErr;

      // @ts-ignore optional dependency
      const VapiModule = await import("@vapi-ai/react-native");
      const Vapi = VapiModule.default;

      this.vapiClient = new Vapi(tokenData.token);
      this.isListening = true;

      await this.vapiClient.start(tokenData.assistantId);
    } catch (err) {
      this.isListening = false;
      throw err;
    }
  }

  async stopListening(): Promise<string> {
    this.isListening = false;
    if (this.vapiClient) {
      this.vapiClient.stop();
    }
    return "";
  }

  async speak(text: string): Promise<void> {
    // Vapi handles TTS internally during the call
    this.isSpeaking = true;
    if (this.vapiClient) {
      this.vapiClient.send({
        type: "add-message",
        message: { role: "assistant", content: text },
      });
    }
    this.isSpeaking = false;
  }

  stopSpeaking(): void {
    this.isSpeaking = false;
    this.vapiClient?.stop();
  }

  cleanup(): void {
    this.vapiClient?.stop();
    this.vapiClient = null;
    this.isListening = false;
    this.isSpeaking = false;
  }
}

// ── Factory ───────────────────────────────────────────────────────

export function createVoiceService(
  provider: "elevenlabs" | "vapi"
): VoiceService {
  switch (provider) {
    case "elevenlabs":
      return new ElevenLabsVoiceService();
    case "vapi":
      return new VapiVoiceService();
    default:
      return new ElevenLabsVoiceService();
  }
}
