"use client";

import { useState } from "react";
import { trackFaqOpened } from "@/lib/analytics/events";
import styles from "./FaqAccordion.module.css";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        trackFaqOpened(id);
      }
      return next;
    });
  }

  return (
    <dl className={styles.accordion}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const buttonId = `faq-btn-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div key={item.id} className={styles.item}>
            <dt>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={styles.button}
                onClick={() => toggle(item.id)}
              >
                <span className={styles.question}>{item.question}</span>
                <span
                  className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
              hidden={!isOpen}
            >
              <p className={styles.answer}>{item.answer}</p>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
