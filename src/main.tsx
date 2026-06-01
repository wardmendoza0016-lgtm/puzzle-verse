import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import CreatePuzzleRoute from "./app/routes/CreatePuzzleRoute";
import LobbyRoute from "./app/routes/LobbyRoute";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/create" element={<CreatePuzzleRoute />} />
      <Route path="/lobby/:id" element={<LobbyRoute />} />
    </Routes>
  </BrowserRouter>
);