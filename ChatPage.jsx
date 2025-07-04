import React, { useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import TextAssistant from "../components/Chat/TextAssistant";
import AvatarAssistant from "../components/Chat/AvatarAssistant";
import SideMenu from "../components/Chat/SideMenu";
import "../styles/Components/SideMenu/sideMenu.css";

const ChatPage = () => {

  const { keycloak } = useKeycloak();
  const bearerToken = keycloak.token;
  const [mode, setMode] = useState("text");
  const [selectedModel, setSelectedModel] = useState({ name: "EiT-GPT", apiName: "EiT-GPT" });
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! How can I help you?", type: "incoming" },
  ]);

  const [showSubtitles, setShowSubtitles] = useState(true);

  const handleApplyModel = (newModel, tabType) => {
    setSelectedModel(newModel);
    setMode(tabType);
    setMessages([{ id: Date.now(), text: "Hi! How can I help you?", type: "incoming" }]);
  };

  return (
    <div className="chat-container">
      <div className="chat-card-container">
      <h1 className="chat-title">Chat with {selectedModel.name}</h1>
      <SideMenu
        selectedModel={selectedModel}
        onApplyModel={handleApplyModel}
        showSubtitles={showSubtitles}
        onToggleSubtitles={setShowSubtitles}
      />
        {mode === "text" ? (
          <TextAssistant bearerToken={bearerToken} selectedModel={selectedModel} messages={messages} setMessages={setMessages} />
        ) : (
          <AvatarAssistant
            bearerToken={bearerToken}
            selectedModel={selectedModel}
            messages={messages}
            setMessages={setMessages}
            showSubtitles={showSubtitles}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;