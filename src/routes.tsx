import { Routes, Route } from "react-router-dom";
import { TapHistory } from "./pages/TapHistory";
import { HomePage } from "./pages/HomePage";
import type { AppSession } from "./session";

export function AppRoutes({ session }: { session: AppSession }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/history" element={<TapHistory session={session} />} />
    </Routes>
  );
}
