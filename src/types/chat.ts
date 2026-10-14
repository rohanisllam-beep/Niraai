export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    sender: 'user' | 'nira';
    content: string;
    image?: {
      data: string;
      mimeType: string;
    } | null;
    timestamp: string;
  }>;
  surveyHistory?: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export const STORAGE_KEY_SESSIONS = 'nira_chat_sessions_v1';
export const STORAGE_KEY_ACTIVE_ID = 'nira_active_chat_id_v1';
