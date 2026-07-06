"use client";

import { useEffect } from "react";

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

function isMeasurementAction(button: HTMLButtonElement) {
  const label = button.textContent?.trim().toLowerCase() ?? "";

  return (
    label.includes("+ mereni") ||
    label.includes("+ nove mereni") ||
    label.includes("+ pridat mereni") ||
    label === "+ mereni"
  );
}

function isLockedEditButton(button: HTMLButtonElement) {
  return button.textContent?.trim().toLowerCase() === "odemceno";
}

function syncButtonState() {
  const noClientResult = isNoClientResult();
  const buttons = Array.from(document.querySelectorAll("button"));

  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

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
}

export default function ButtonGuards() {
  useEffect(() => {
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

    const observer = new MutationObserver(syncButtonState);

    syncButtonState();
    document.addEventListener("click", handleClick, true);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
