# 💬 Chat System Documentation

> **Status:** Production Ready (v2.1)
> **Last Updated:** November 2025

## 🎯 Overview

The chat system has been refactored to mimic the behavior of modern AI assistants (like ChatGPT/Claude). It prioritizes user experience by ensuring chats are only created when necessary and all messages are reliably saved.

## 🧠 Core Logic

### 1. Lazy Chat Creation

Chats are **NOT** created automatically when entering the page.

- **Trigger:** The first user message initiates chat creation.
- **Flow:**
  1. User types message → `onMessageSave` triggered.
  2. System checks if `chatId` exists.
  3. If `null`, calls `POST /webhook/chat-create`.
  4. **Immediate Propagation:** `setChatId` is called in the Zustand store to instantly update the UI state.

### 2. Smart Naming

- **Logic:** The chat title is automatically generated from the **first 50 characters** of the user's first message.
- **Benefit:** Eliminates "New Chat" placeholders and makes history easier to navigate.

### 3. Message Persistence (Critical)

We implemented a robust mechanism to handle race conditions between chat creation and message saving.

**The Problem:**
Previously, the AI response often failed to save because the `AnimatedAIChat` component held a stale `null` reference to `chatId` in its closure, even after the chat was created.

**The Solution:**

- **User Message:** Saved immediately after chat creation using the new ID.
- **AI Message:** The saving logic in `VoiceAssistantPage` now explicitly fetches the **latest** `chatId` from the global `useChatStore` state, bypassing any stale props.
- **UI Component:** The `AnimatedAIChat` component no longer blocks saving if its local `chatId` is null; it delegates the responsibility to the parent handler.

### 4. Duplicate Prevention

To prevent "double chats" (one with the question, one with the answer):

- The `loadChatHistory` effect in `AnimatedAIChat` now checks if local messages already exist.
- If messages exist (meaning the user just started this conversation), it **skips** loading history from the API.
- This prevents the UI from clearing the just-typed message and confusing the state.

## 🔌 API Endpoints

### Chat Management

- `POST /webhook/chat-create` - Create new chat
- `POST /webhook/chat-rename` - **[NEW]** Rename chat (Owner/Company access)
- `POST /webhook/chat-delete` - Delete chat
- `POST /webhook/chat-list` - Get user's chat history

### Messaging

- `POST /webhook/chat-save-message` - Save message (User/Assistant)
- `POST /webhook/chat-get-history` - Load full history

## 📱 Frontend Implementation

**Key Components:**

- `VoiceAssistantPage.tsx`: Orchestrates chat creation and message saving.
- `AnimatedAIChat.tsx`: Handles UI, animations, and history loading.
- `useChatStore.ts`: Global state management for current chat session.

## 🐛 Debugging

If you encounter issues with message saving:

1. Check the **Console Logs** (preserved via Eruda on mobile).
2. Look for `[VoiceAssistantPage]` logs.
3. Verify `chatId` propagation in the logs: `✅ Chat created: ...` followed by `📥 Got chatId from store...`.
