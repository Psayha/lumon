import { create } from 'zustand';

interface MessageSaveState {
  messageId: string;
  status: 'idle' | 'saving' | 'success' | 'error';
  error?: string;
}

interface ChatState {
  // Current chat ID
  chatId: string | null;
  setChatId: (chatId: string | null) => void;

  // Message saving state per message
  messageSaveStates: Map<string, MessageSaveState>;
  setMessageSaving: (messageId: string) => void;
  setMessageSaved: (messageId: string) => void;
  setMessageError: (messageId: string, error: string) => void;
  clearMessageState: (messageId: string) => void;

  // Chat creation state
  isCreatingChat: boolean;
  chatCreationError: string | null;
  setChatCreating: () => void;
  setChatCreated: (chatId: string) => void;
  setChatCreationError: (error: string) => void;

  // Reset all state
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Chat ID
  chatId: null,
  setChatId: (chatId) => set({ chatId }),

  // Message saving states
  messageSaveStates: new Map(),

  setMessageSaving: (messageId) =>
    set((state) => {
      const newStates = new Map(state.messageSaveStates);
      newStates.set(messageId, {
        messageId,
        status: 'saving',
      });
      return { messageSaveStates: newStates };
    }),

  setMessageSaved: (messageId) =>
    set((state) => {
      const newStates = new Map(state.messageSaveStates);
      newStates.set(messageId, {
        messageId,
        status: 'success',
      });
      // Auto-clear success state after 2 seconds
      setTimeout(() => {
        set((s) => {
          const cleared = new Map(s.messageSaveStates);
          cleared.delete(messageId);
          return { messageSaveStates: cleared };
        });
      }, 2000);
      return { messageSaveStates: newStates };
    }),

  setMessageError: (messageId, error) =>
    set((state) => {
      const newStates = new Map(state.messageSaveStates);
      newStates.set(messageId, {
        messageId,
        status: 'error',
        error,
      });
      return { messageSaveStates: newStates };
    }),

  clearMessageState: (messageId) =>
    set((state) => {
      const newStates = new Map(state.messageSaveStates);
      newStates.delete(messageId);
      return { messageSaveStates: newStates };
    }),

  // Chat creation state
  isCreatingChat: false,
  chatCreationError: null,

  setChatCreating: () =>
    set({ isCreatingChat: true, chatCreationError: null }),

  setChatCreated: (chatId) =>
    set({ isCreatingChat: false, chatCreationError: null, chatId }),

  setChatCreationError: (error) =>
    set({ isCreatingChat: false, chatCreationError: error }),

  // Reset
  reset: () =>
    set({
      chatId: null,
      messageSaveStates: new Map(),
      isCreatingChat: false,
      chatCreationError: null,
    }),
}));
