import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useRef, useCallback } from 'react';

export default function MonacoWrapper() {
  const {
    activeFile, files, fontSize, theme, wordWrap, minimap,
    updateFileContent, locked, submitted, getLanguage
  } = useEditorStore();
  const editorRef = useRef(null);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    // Overwrite the 'Copy' command in Monaco
    editor.addAction({
      id: 'internal-copy',
      label: 'Copy (Internal)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
      run: (ed) => {
        const selection = ed.getSelection();
        const text = ed.getModel().getValueInRange(selection);
        if (text) {
          useEditorStore.setState({ internalClipboard: text });
          // Poison the system clipboard
          navigator.clipboard.writeText('[SECURITY ALERT] This activity is recorded.').catch(() => {});
        }
        return null;
      }
    });

    // Overwrite the 'Paste' command in Monaco
    editor.addAction({
      id: 'internal-paste',
      label: 'Paste (Internal)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
      run: (ed) => {
        const text = useEditorStore.getState().internalClipboard;
        if (text) {
          const selection = ed.getSelection();
          const range = new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          );
          ed.executeEdits('internal-paste', [{ range, text, forceMoveMarkers: true }]);
        }
        return null;
      }
    });

    // Block right-click context menu copy/paste by removing them or intercepting
    // (Simpler: just block the context menu entirely for the editor)
    editor.onContextMenu((e) => {
      e.event.preventDefault();
      e.event.stopPropagation();
    });
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
        contextmenu: false, // NEW: Explicitly disable Monaco's context menu
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
