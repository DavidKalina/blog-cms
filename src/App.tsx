import { MarkdownEditor } from "./components/MarkdownEditor";

function App() {
  return (
    <div className="mx-auto p-4">
      <MarkdownEditor
        initialContent="# Welcome to your new markdown editor\n\nStart writing your content here..."
        onChange={() => {}}
      />
    </div>
  );
}

export default App;
