"use client";

import { useEffect } from "react";

type SelectedClient = {
  id: string;
  name: string;
} | null;

const SELECTED_CLIENT_CHANGE = "knee:selected-client-change";
const SELECTED_CLIENT_REQUEST = "knee:selected-client-request";

function readSelectedClient(): SelectedClient {
  const selects = Array.from(document.querySelectorAll("select"));
  const clientSelect = selects.find((select) => select.value && select.selectedOptions[0]);
  const selectedOption = clientSelect?.selectedOptions[0];

  if (!clientSelect?.value || !selectedOption) return null;

  return {
    id: clientSelect.value,
    name: selectedOption.textContent?.trim() || "vybraneho klienta",
  };
}

function publishSelectedClient() {
  window.dispatchEvent(
    new CustomEvent<SelectedClient>(SELECTED_CLIENT_CHANGE, {
      detail: readSelectedClient(),
    }),
  );
}

function isNoClientResult() {
  const selects = Array.from(document.querySelectorAll("select"));

  return selects.some((select) => {
    const options = Array.from(select.options);
    const hasOnlyEmptyResult =
      options.length === 1 &&
      options[0]?.value === "" &&
      options[0]?.textContent?.toLowerCase().includes("zadny vysledek");

    return hasOnlyEmptyResult || select.value === "";
  });
}

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().toLowerCase() ?? "";
}

function isMeasurementAction(button: HTMLButtonElement) {
  const label = buttonLabel(button);

  return (
    label.includes("+ mereni") ||
    label.includes("+ nove mereni") ||
    label.includes("+ pridat mereni") ||
    label === "+ mereni"
  );
}

function isLockedEditButton(button: HTMLButtonElement) {
  return buttonLabel(button) === "odemceno";
}

function relabelArchiveButtons(button: HTMLButtonElement) {
  const label = buttonLabel(button);

  if (!button.classList.contains("danger-button")) {
    return;
  }

  if (label === "smazat") {
    button.textContent = "Archivovat mereni";
    button.title = "Archivuje se pouze toto mereni. Klient zustane aktivni.";
  }

  if (label === "mazu...") {
    button.textContent = "Archivuji mereni...";
  }
}

function syncButtonState() {
  const noClientResult = isNoClientResult();
  const buttons = Array.from(document.querySelectorAll("button"));

  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    relabelArchiveButtons(button);

    if (isLockedEditButton(button)) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.title = "Editace je uz otevrena. Zmeny uloz nebo zrus ve formulari.";
      return;
    }

    if (isMeasurementAction(button)) {
      button.disabled = noClientResult;
      button.setAttribute("aria-disabled", noClientResult ? "true" : "false");
      button.title = noClientResult ? "Nejdriv vyber klienta z vysledku hledani." : "";
    }
  });

  publishSelectedClient();
}

export default function ButtonGuards() {
  useEffect(() => {
    const originalConfirm = window.confirm;

    window.confirm = (message?: string) => {
      const text = String(message ?? "").replace(
        "Opravdu smazat mereni",
        "Opravdu archivovat pouze toto mereni",
      );

      return originalConfirm(text);
    };

    const handleClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest("button");

      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      if (isLockedEditButton(button) || (isMeasurementAction(button) && isNoClientResult())) {
        event.preventDefault();
        event.stopPropagation();
        syncButtonState();
      }
    };
    const handleSelectedClientRequest = () => publishSelectedClient();
    const observer = new MutationObserver(syncButtonState);

    syncButtonState();
    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", syncButtonState, true);
    window.addEventListener(SELECTED_CLIENT_REQUEST, handleSelectedClientRequest);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.confirm = originalConfirm;
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", syncButtonState, true);
      window.removeEventListener(SELECTED_CLIENT_REQUEST, handleSelectedClientRequest);
      observer.disconnect();
    };
  }, []);

  return null;
}
