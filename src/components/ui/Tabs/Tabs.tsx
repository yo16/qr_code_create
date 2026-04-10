"use client";

import { useState, useId, useRef, KeyboardEvent } from "react";
import styles from "./Tabs.module.css";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(
    defaultTab ?? tabs[0]?.id ?? ""
  );
  const instanceId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    setActiveTab(tabs[nextIndex].id);
    // Focus the new tab button
    const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
      "[role='tab']"
    );
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="タブ"
        className={styles.tabList}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const tabId = `${instanceId}-tab-${tab.id}`;
          const panelId = `${instanceId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className={[styles.tab, isActive ? styles.tabActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const tabId = `${instanceId}-tab-${tab.id}`;
        const panelId = `${instanceId}-panel-${tab.id}`;
        return (
          <div
            key={tab.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className={styles.panel}
          >
            {isActive && tab.content}
          </div>
        );
      })}
    </div>
  );
}
