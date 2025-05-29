
'use client';

import { Button } from "@/components/ui/button";
import { Bot, SendHorizonal, X, Loader2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handleChatbotMessageAction } from "@/app/actions";
import type { ChatHistoryMessage, ChatMessageRole } from "@/ai/flows/math-chatbot-flow";

interface DisplayMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

const MAX_HISTORY_LENGTH = 10; // Keep last N messages for history

export default function FloatingChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) { 
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

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    const userText = inputValue;
    setInputValue('');

    const newUserMessage: DisplayMessage = { 
      id: 'user-' + Date.now(), 
      sender: 'user', 
      text: userText,
      timestamp: new Date() 
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsBotTyping(true);

    const historyForAI: ChatHistoryMessage[] = messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'bot') 
      .slice(-MAX_HISTORY_LENGTH)
      .map(msg => ({
        role: (msg.sender === 'bot' ? 'model' : msg.sender) as ChatMessageRole,
        content: [{ text: msg.text }], // Changed from 'parts' to 'content'
      }));
    
    const actionResult = await handleChatbotMessageAction(userText, historyForAI);
    setIsBotTyping(false);

    if (actionResult.error) {
      const errorMessage: DisplayMessage = {
        id: 'error-' + Date.now(),
        sender: 'system',
        text: actionResult.error,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } else if (actionResult.data) {
      const botResponse: DisplayMessage = {
        id: 'bot-' + (Date.now() + 1), 
        sender: 'bot', 
        text: actionResult.data.botResponse,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } else {
      const fallbackError: DisplayMessage = {
        id: 'error-' + Date.now(),
        sender: 'system',
        text: "Sorry, I couldn't get a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, fallbackError]);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      // The ScrollArea component might have its viewport in a nested div
      // This attempts to find the actual scrollable element.
      // Common structure is a div with attribute `data-radix-scroll-area-viewport`
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isBotTyping]);


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
                      : msg.sender === 'bot'
                      ? 'bg-muted text-muted-foreground rounded-bl-none'
                      : 'bg-destructive/20 text-destructive-foreground border border-destructive/50 rounded-md w-full'
                  }`}
                >
                  {msg.text}
                  <div className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-primary-foreground/70 text-right' 
                    : msg.sender === 'bot' ? 'text-muted-foreground/70' 
                    : 'text-destructive-foreground/70' 
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isBotTyping && (
              <div className="flex justify-start mb-3">
                <div className="p-3 rounded-lg max-w-[85%] text-sm shadow bg-muted text-muted-foreground rounded-bl-none flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Bot is typing...
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-3 border-t border-border flex gap-2 items-center bg-card rounded-b-lg">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isBotTyping && handleSendMessage()}
              placeholder="Ask something..."
              className="flex-grow p-2 border-input focus:ring-ring focus:ring-1"
              aria-label="Chat input"
              disabled={isBotTyping}
            />
            <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10" aria-label="Send message" disabled={isBotTyping || inputValue.trim() === ''}>
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
