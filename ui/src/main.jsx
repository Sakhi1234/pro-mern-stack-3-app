import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppProviders from "./AppProviders.jsx";
import createEmotionCache from "./createEmotionCache.js";
import reviveDates from "./utils/reviveDates.js";
import App from "./App.jsx";
import "./index.css";

const dataElement = document.getElementById("initial-data");
const initialData = dataElement
  ? reviveDates(JSON.parse(dataElement.textContent))
  : null;
const root = document.getElementById("root");
const element = (
  <StrictMode>
    <AppProviders cache={createEmotionCache()}>
      <BrowserRouter>
        <App initialData={initialData} />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>
);

if (initialData) {
  hydrateRoot(root, element);
} else {
  createRoot(root).render(element);
}
