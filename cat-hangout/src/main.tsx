import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Content } from "./content/content.tsx";
import {
  BabylonLiteReadout,
  BabylonLiteSettings,
  BabylonPresentationProvider,
} from "./content/babylon/babylon-presentation.tsx";
import { App } from "./ui/app.tsx";
import "./ui/style.css";

function AppComposition() {
  return (
    <App
      content={<Content />}
      contentPresentation={{
        title: "Babylon Lite",
        Readout: BabylonLiteReadout,
        Settings: BabylonLiteSettings,
      }}
    />
  );
}

createRoot(document.getElementById("root") ?? (() => { throw new Error("Missing application root"); })()).render(
  <StrictMode>
    <BabylonPresentationProvider>
      <AppComposition />
    </BabylonPresentationProvider>
  </StrictMode>,
);
