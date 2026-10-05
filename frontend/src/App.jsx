import { Routes, Route, Navigate } from "react-router";
import Navbar from "./components/NavBar";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import ChatPage from "./components/ChatPage";
import TeamPage from "./components/TeamPage";
import HomePage from "./components/HomePage";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/equipe" element={<TeamPage />} />          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;