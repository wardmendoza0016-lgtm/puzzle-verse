import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import CreatePuzzleRoute from "./app/routes/CreatePuzzleRoute.tsx";
import LobbyRoute from "./app/routes/LobbyRoute.tsx";
import GameRoute from "./app/routes/GameRoute.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/create" element={<CreatePuzzleRoute />} />
      <Route path="/lobby/:id" element={<LobbyRoute />} />
      <Route path="/game/:id" element={<GameRoute />} />
    </Routes>
  </BrowserRouter>
);