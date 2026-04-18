import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useRef, useCallback } from 'react';

export default function MonacoWrapper() {
  const {
    activeFile, files, fontSize, theme, wordWrap, minimap,
    updateFileContent, locked, submitted, getLanguage
  } = useEditorStore();
  const editorRef = useRef(null);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleChange = useCallback((value) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value);
    }
  }, [activeFile, updateFileContent]);

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-editor">
        <div className="text-center">
          <p className="text-text-muted text-lg mb-2">No file selected</p>
          <p className="text-text-muted text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  const language = getLanguage(activeFile);

  return (
    <Editor
      key={activeFile}
      path={activeFile}
      language={language}
      value={files[activeFile] || ''}
      theme={theme}
      onChange={handleChange}
      onMount={handleEditorMount}
      options={{
        fontSize,
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        minimap: { enabled: minimap },
        wordWrap,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 12 },
        readOnly: locked || submitted,
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        suggest: {
          showWords: true,
          showSnippets: true,
        },
      }}
    />
  );
}
