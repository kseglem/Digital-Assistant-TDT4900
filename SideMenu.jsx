import React, { useState } from "react";
import sidebarIcon from "../../icons/sidebar.png";
import rightarrowIcon from "../../icons/rightarrow.png";
import ChatSettings from "./ChatSettings";
import "../../styles/Components/SideMenu/sideMenu.css";


const SideMenu = ({
      selectedModel,
      onApplyModel,
      showSubtitles,
      onToggleSubtitles,
    }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("text");

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button className={`side-menu-toggle ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
        <img src={sidebarIcon} alt="Toggle Side Menu" />
      </button>
      <div className={`side-menu ${isOpen ? "open" : ""}`}>
        <div className="side-menu-tabs">
          <button className={selectedTab === "text" ? "active" : ""} onClick={() => setSelectedTab("text")}>Text</button>
          <button className={selectedTab === "avatar" ? "active" : ""} onClick={() => setSelectedTab("avatar")}>Avatar</button>
        </div>
        <ChatSettings 
          selectedTab={selectedTab}
          selectedModel={selectedModel} 
          onApplyModel={onApplyModel}
          rightarrowIcon={rightarrowIcon}
          onCloseMenu={closeMenu}
          showSubtitles={showSubtitles}
          onToggleSubtitles={onToggleSubtitles}
        />
      </div>
    </>
  );
};

export default SideMenu;