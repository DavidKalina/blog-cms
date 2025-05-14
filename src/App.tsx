import AnimatedBackground from "./components/AnimatedBackground";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { ThemeProvider } from "./contexts/ThemeProvider";

function AppContent() {
  return (
    <div className="h-screen flex flex-col">
      <MarkdownEditor
        content="# Welcome to your new markdown editor\n\nStart writing your content here..."
        onChange={() => {}}
        className="flex-1"
      />
      <AnimatedBackground />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
