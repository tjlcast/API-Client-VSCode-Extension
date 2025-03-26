// import Editor from "@monaco-editor/react";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";

import { OPTION, REQUEST, RESPONSE } from "../constants";
import ResponsePreview from "../features/Response/Preview/ResponsePreview";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript"; // 根据需要引入语言模式
import "ace-builds/src-noconflict/theme-github"; // 根据需要引入主题

interface ICodeEditorProps {
  language: string;
  editorOption: any;
  viewOption?: string;
  editorHeight: string;
  requestForm?: boolean;
  previewMode?: boolean;
  codeEditorValue: string;
  shouldBeautifyEditor?: boolean;
  handleEditorChange?: (value: string | undefined) => void;
  handleBeautifyButton?: () => void;
}

const CodeEditor = ({
  language,
  viewOption,
  requestForm,
  previewMode,
  editorOption,
  editorHeight,
  codeEditorValue,
  handleEditorChange,
  shouldBeautifyEditor,
  handleBeautifyButton,
}: ICodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const handleEditorOnMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (shouldBeautifyEditor && requestForm) {
      if (handleBeautifyButton) {
        handleBeautifyButton();
      }

      // setTimeout(async () => {
      //   await editorRef.current.getAction("editor.action.formatDocument").run();
      // }, 200);
      try {
        const beautifiedCode = JSON.stringify(
          JSON.parse(codeEditorValue),
          null,
          2,
        );
        if (handleEditorChange) {
          handleEditorChange(beautifiedCode);
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  }, [shouldBeautifyEditor]);

  useEffect(() => {
    if (requestForm || !previewMode || viewOption === RESPONSE.PREVIEW) return;

    if (editorRef.current?.getValue() !== codeEditorValue) {
      editorRef.current?.setValue(codeEditorValue);
    }

    setTimeout(async () => {
      editorRef.current?.updateOptions(OPTION.READ_ONLY_FALSE_OPTION);

      await editorRef.current?.getAction("editor.action.formatDocument").run();

      if (viewOption === REQUEST.RAW) {
        editorRef.current?.updateOptions(OPTION.LINE_NUMBER_OPTION);
      } else {
        editorRef.current?.updateOptions(OPTION.READ_ONLY_TRUE_OPTION);
      }
    }, 300);
  }, [viewOption, language]);

  return (
    <EditorWrapper>
      {viewOption === RESPONSE.PREVIEW && previewMode ? (
        <ResponsePreview sourceCode={codeEditorValue} />
      ) : (
        // <Editor
        //   height={editorHeight}
        //   language={language}
        //   theme={RESPONSE.THEME}
        //   value={codeEditorValue}
        //   options={editorOption}
        //   onChange={handleEditorChange}
        //   onMount={handleEditorOnMount}
        // />
        <AceEditor
          mode="javascript" // 设置语言模式
          theme="github" // 设置主题
          onChange={handleEditorChange}
          name="UNIQUE_ID_OF_DIV"
          editorProps={{ $blockScrolling: true }}
          value={codeEditorValue} // 替换为你的初始值
          height={editorHeight} // 设置高度
        />
      )}
    </EditorWrapper>
  );
};

const EditorWrapper = styled.div`
  margin-top: 2rem;
`;

export default CodeEditor;
