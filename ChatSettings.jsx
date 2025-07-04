import React, { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { getAvailableModels } from "../../api/apiController";
import "../../styles/Components/SideMenu/sideMenu.css";

const ChatSettings = ({ rightarrowIcon, selectedModel, onApplyModel, selectedTab, onCloseMenu, showSubtitles, onToggleSubtitles }) => {
  const { keycloak } = useKeycloak();
  const bearerToken = keycloak.token;
  const [showAImodelOptions, setShowAImodelOptions] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [models, setModels] = useState([]);
  const [localSelectedModel, setLocalSelectedModel] = useState(selectedModel);
  const [showAIModelOptions, setShowSIModelOptions]   = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [showVoiceOptions, setShowVoiceOptions]   = useState(false);

  const toggleAImodelOptions = () => {
    setShowAImodelOptions(prev => !prev);
  };

  const toggleModelOptions = () => {
    setShowModelOptions(prev => !prev);
  };

  const toggleLanguageOptions = () => {
    setShowLanguageOptions(prev => !prev);
  };

  const toggleVoiceOptions = () => {
    setShowVoiceOptions(prev => !prev);
  };

  useEffect(() => {
    const fetchModels = async () => {
      const availableModels = await getAvailableModels(bearerToken);
      const modelObjects = availableModels.map(model =>
        typeof model === "string" ? { name: model, apiName: model } : model
      );
      setModels(modelObjects);
      if (!modelObjects.some(m => m.name === localSelectedModel.name) && modelObjects.length > 0) {
        setLocalSelectedModel(modelObjects[0]);
      }
    };
    fetchModels();
  }, [bearerToken]);

  const handleApply = () => {
    onApplyModel(localSelectedModel, selectedTab);
    onCloseMenu();
  };

  const models2 = [{
    "provider": "openai",
    "model": "English"
},
{
    "provider": "openai",
    "model": "Norwegian"
}]

  return (
    <div className="side-menu-content">
      <div className="settings-group">
        <h3>Settings</h3>
        <div className="setting-row">
          <span>Knowledge Base</span>
          <button className={`right-arrow-button ${showAImodelOptions ? "rotated" : ""}`} onClick={toggleAImodelOptions}>
            <img src={rightarrowIcon} alt="Show models" />
          </button>
        </div>
        {showAImodelOptions && (
          <div className="options-list">
            {models.length > 0 ? (
              models.map((model, index) => (
                <div
                  key={index}
                  className="option-item"
                  onClick={() => setLocalSelectedModel(model)}
                  style={{ cursor: "pointer", backgroundColor: model.name === localSelectedModel.name ? "#e0e0ff" : "transparent" }}
                >
                  {model.name}
                  {model.name === localSelectedModel.name && <span style={{ marginLeft: "8px" }}>✓</span>}
                </div>
              ))
            ) : (
              <div className="option-item">Loading models...</div>
            )}
          </div>
        )}
        <div className="setting-row">
          <span>AI Model</span>
          <button
            className={`right-arrow-button ${showModelOptions ? "rotated" : ""}`}
            onClick={toggleModelOptions}
          >
            <img src={rightarrowIcon} alt="Show AI model options" />
          </button>
        </div>
        {showModelOptions && (
          <div className="options-list">
            <div className="option-item">Coming soon</div>
          </div>
        )}
        <div className="setting-row">
          <span>Language</span>
          <button
            className={`right-arrow-button ${showLanguageOptions ? "rotated" : ""}`}
            onClick={toggleLanguageOptions}
          >
            <img src={rightarrowIcon} alt="Show language options" />
          </button>
        </div>
        {showLanguageOptions && (
          <div className="options-list">
            <div className="option-item">Coming soon</div>
          </div>
        )}
        <div className="setting-row">
          <span>Voice</span>
          <button
            className={`right-arrow-button ${showVoiceOptions ? "rotated" : ""}`}
            onClick={toggleVoiceOptions}
          >
            <img src={rightarrowIcon} alt="Show language options" />
          </button>
        </div>
        {showVoiceOptions && (
          <div className="options-list">
            <div className="option-item">Coming soon</div>
          </div>
        )}
        <div className="setting-row">
          <span>Subtitles</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={showSubtitles}
              onChange={(e) => onToggleSubtitles(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      <button className="apply-button" onClick={handleApply}>Apply</button>
    </div>
  );
};

export default ChatSettings;