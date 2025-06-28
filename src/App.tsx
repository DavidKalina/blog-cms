import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Login } from "./pages/Login";
import { FileUploader } from "./pages/FileUploader";
import { ArticleManager } from "./pages/ArticleManager";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/editor/:id" element={<Editor />} />
      <Route path="/upload" element={<FileUploader />} />
      <Route path="/articles" element={<ArticleManager />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
