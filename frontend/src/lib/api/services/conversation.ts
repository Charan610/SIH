export interface MessageTurn {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  audioUrl?: string;
  extractedSlots?: Record<string, any>;
}

export interface ConversationSession {
  sessionId: string;
  language: "en" | "te" | "hi";
  turns: MessageTurn[];
  status: "active" | "completed";
}

export const conversationService = {
  createSession(language: "en" | "te" | "hi" = "en"): ConversationSession {
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      language,
      turns: [],
      status: "active",
    };
  },

  addTurn(session: ConversationSession, turn: Omit<MessageTurn, "id" | "timestamp">): ConversationSession {
    const newTurn: MessageTurn = {
      ...turn,
      id: `turn_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    return {
      ...session,
      turns: [...session.turns, newTurn],
    };
  }
};
