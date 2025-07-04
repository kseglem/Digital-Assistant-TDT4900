import React, { useState, useEffect, useRef } from "react";
import { sendChatMessage } from "../../api/apiController";
import micIcon from "../../icons/mic.png";
import sendIcon from "../../icons/send.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../../styles/pages/chat.css";

const TextAssistant = ({ bearerToken, selectedModel, messages, setMessages }) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const recentMessages = messages.slice(-4);
    return recentMessages.map(m => `${m.type === "outgoing" ? "User" : "Assistant"}: ${m.text}`).join("\n");
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const outgoingMessage = { id: Date.now(), text: inputValue, type: "outgoing" };
    const newMessages = [...messages, outgoingMessage];
    setMessages(newMessages);
    const conversationContext = buildContext();
    const userMessage = inputValue;
    setInputValue("");
    const apiResponse = await sendChatMessage(bearerToken, userMessage, conversationContext, selectedModel.apiName);
    const incomingMessage = { id: Date.now() + 1, text: apiResponse, type: "incoming" };
    setMessages(prev => [...prev, incomingMessage]);
  };

  const handleMicClick = () => {
    alert("Voice input coming soon!");
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-wrapper ${msg.type}`}>
            <div className="chat-message">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <button className="chat-mic-button" onClick={handleMicClick}>
          <img src={micIcon} alt="Mic" />
        </button>
        <div className="chat-input-bubble">
          <input
            type="text"
            className="chat-text-input"
            placeholder="Type here to ask a question"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter") handleSend(); }}
          />
        </div>
        <button className="chat-send-button" onClick={handleSend}>
          <img src={sendIcon} alt="Send" />
        </button>
      </div>
    </>
  );
};

export default TextAssistant;