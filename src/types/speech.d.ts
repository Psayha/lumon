// Типы для Web Speech API

declare global {
    interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        start(): void;
        stop(): void;
        abort(): void;
        onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
        onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    }

    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
        resultIndex: number;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
        message: string;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognitionResult {
        readonly length: number;
        readonly isFinal: boolean;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }

    interface SpeechRecognitionConstructor {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    }

    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

export {};

