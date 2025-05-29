
'use client';

import { Button } from "@/components/ui/button";
import { Bot, SendHorizonal, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function FloatingChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) { // Add a welcome message when opening for the first time
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          sender: 'bot',
          text: "Hello! I'm MathVerse AI. How can I assist you with math today?",
          timestamp: new Date(),
        }
      ]);
    }
  };

  const getBotResponse = (userText: string): string => {
    const lowerUserText = userText.toLowerCase();
    if (lowerUserText.includes("hello") || lowerUserText.includes("hi")) {
      return "Hello there! How can I help you?";
    }
    if (lowerUserText.includes("help")) {
      return "Sure, I can try to help! What do you need assistance with?";
    }
    if (lowerUserText.includes("integral") || lowerUserText.includes("derivative") || lowerUserText.includes("algebra")) {
      return `Ah, ${lowerUserText.match(/integral|derivative|algebra/)?.[0]}! You can explore these topics in our workstation pages.`;
    }
    if (lowerUserText.includes("thank")) {
      return "You're welcome!";
    }
    // Fallback responses
    const responses = [
      `I received your message: "${userText}". I'm still learning!`,
      "That's an interesting point!",
      "Could you tell me more?",
      "I'm processing that. Ask me another question in the meantime!",
      "For complex queries, try our dedicated operation pages!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    const newUserMessage: ChatMessage = { 
      id: 'user-' + Date.now(), 
      sender: 'user', 
      text: inputValue,
      timestamp: new Date() 
    };
    
    const botText = getBotResponse(inputValue);
    const botResponse: ChatMessage = {
      id: 'bot-' + (Date.now() + 1), 
      sender: 'bot', 
      text: botText,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage, botResponse]);
    setInputValue('');
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={toggleChat}
        aria-label="Toggle Chatbot"
      >
        <Bot className="h-8 w-8" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[calc(100vh-12rem)] max-h-[36rem] bg-card shadow-xl rounded-lg flex flex-col z-50 border border-border">
          <div className="p-4 bg-primary text-primary-foreground rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold text-lg">MathVerse AI Assistant</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="text-primary-foreground hover:bg-primary/80 h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-grow p-3 space-y-3" ref={scrollAreaRef as any}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[85%] text-sm shadow ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  }`}
                >
                  {msg.text}
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          
          <div className="p-3 border-t border-border flex gap-2 items-center bg-card rounded-b-lg">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask something..."
              className="flex-grow p-2 border-input focus:ring-ring focus:ring-1"
              aria-label="Chat input"
            />
            <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10" aria-label="Send message">
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
