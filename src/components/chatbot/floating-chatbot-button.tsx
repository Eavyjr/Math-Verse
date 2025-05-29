
'use client';

import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useState } from "react";

// Placeholder for actual chat functionality
interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function FloatingChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Placeholder for sending a message
  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    // For now, just echoes the user message
    const newUserMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputValue };
    const botResponse: ChatMessage = {id: (Date.now() + 1).toString(), sender: 'bot', text: `Echo: ${inputValue}`};
    
    setMessages([...messages, newUserMessage, botResponse]);
    setInputValue('');
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={toggleChat}
        aria-label="Toggle Chatbot"
      >
        <Bot className="h-7 w-7" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-card shadow-xl rounded-lg flex flex-col z-50 border border-border">
          <div className="p-3 bg-primary text-primary-foreground rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold text-lg">MathVerse AI Assistant</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="text-primary-foreground hover:bg-primary/80">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </Button>
          </div>
          <div className="flex-grow p-3 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground p-4">
                Ask me anything about math!
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground self-end ml-auto'
                    : 'bg-muted text-muted-foreground self-start mr-auto'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask something..."
              className="flex-grow p-2 border border-input rounded-md focus:ring-ring focus:outline-none focus:ring-2"
            />
            <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/80 text-primary-foreground">
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
