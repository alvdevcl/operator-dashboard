import React from 'react';
import Editor from '@monaco-editor/react';
import { useThemeStore } from '../store/theme';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function YamlEditor({ value, onChange }: YamlEditorProps) {
  const { theme } = useThemeStore();

  return (
    <div className="h-[600px] border rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="yaml"
        theme={theme === 'light' ? 'light' : 'vs-dark'}
        value={value}
        onChange={(value) => onChange(value || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}