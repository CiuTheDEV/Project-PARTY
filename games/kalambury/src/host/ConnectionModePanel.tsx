import { useState } from "react";
import type { KalamburyTransportMode } from "../transport/types";
import {
  getTransportMode,
  setTransportMode,
} from "../transport/index";

type ModeOption = {
  id: KalamburyTransportMode;
  label: string;
  description: string;
  icon: string;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "do-ws",
    label: "DO + WebSocket",
    description: "Produkcyjny, najszybszy",
    icon: "bolt",
  },
  {
    id: "firebase",
    label: "Firebase",
    description: "Alternatywa, działa globalnie",
    icon: "cloud",
  },
  {
    id: "broadcast",
    label: "Broadcast Channel",
    description: "Lokalnie, jedno urządzenie",
    icon: "devices",
  },
];

export function ConnectionModePanel() {
  const [selected, setSelected] = useState<KalamburyTransportMode>(
    getTransportMode,
  );

  function handleSelect(mode: KalamburyTransportMode) {
    setSelected(mode);
    setTransportMode(mode);
  }

  return (
    <div className="kal-hub-connection-panel">
      <ul className="kal-hub-connection-panel__list">
        {MODE_OPTIONS.map((option) => {
          const isActive = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={
                  isActive
                    ? "kal-hub-connection-panel__option kal-hub-connection-panel__option--active"
                    : "kal-hub-connection-panel__option"
                }
                aria-pressed={isActive}
                onClick={() => handleSelect(option.id)}
              >
                <span
                  className="material-symbols-outlined kal-hub-connection-panel__icon"
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
                <span className="kal-hub-connection-panel__content">
                  <span className="kal-hub-connection-panel__label">
                    {option.label}
                  </span>
                  <span className="kal-hub-connection-panel__desc">
                    {option.description}
                  </span>
                </span>
                {isActive && (
                  <span
                    className="material-symbols-outlined kal-hub-connection-panel__check"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
