const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Chat {
  _id: string;
  participants: any[];
  messages: any[];
  isSupportChat: boolean;
  lastMessage?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

class ChatService {
  async startChat(userId: string): Promise<{ success: boolean; chat: Chat }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start chat');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error;
    }
  }

  async getUserChats(userId: string): Promise<{ success: boolean; chats: Chat[] }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/user-chats`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string): Promise<{ success: boolean; messages: Message[] }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/${chatId}/messages`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/chat/${chatId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
}

export const chatService = new ChatService();