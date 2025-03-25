import React, { FormEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import shallow from "zustand/shallow";

import { COMMON } from "../../../constants";
import useStore from "../../../store/useStore";
import RequestButton from "../Button/RequestButton";
import RequestDetailOption from "../Menu/RequestMenu";
import RequestMethod from "../Method/RequestMethod";
import RequestUrl from "../Url/RequestUrl";
import Button from "../../../components/Button";

const RequestPanel = () => {
  const requestMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    requestData,
    requestMenuHeight,
    handleRequestProcessStatus,
    handleRequestMethodChange,
    handleRequestUrlChange,
    handleRequestKey,
    handleRequestValue,
    handleRequestBodyOption,
    handleBodyRawOption,
    handleBodyRawOptionData,
  } = useStore(
    (state) => ({
      requestData: {
        authData: state.authData,
        requestUrl: state.requestUrl,
        authOption: state.authOption,
        bodyOption: state.bodyOption,
        bodyRawData: state.bodyRawData,
        bodyRawOption: state.bodyRawOption,
        requestMethod: state.requestMethod,
        keyValueTableData: state.keyValueTableData,
      },
      requestMenuHeight: state.requestMenuHeight,
      handleRequestProcessStatus: state.handleRequestProcessStatus,
      handleRequestMethodChange: state.handleRequestMethodChange,
      handleRequestUrlChange: state.handleRequestUrlChange,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
      handleRequestBodyOption: state.handleRequestBodyOption,
      handleBodyRawOptionData: state.handleBodyRawOptionData,
      handleBodyRawOption: state.handleBodyRawOption,
    }),
    shallow,
  );

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (requestData.requestUrl.length !== 0) {
      handleRequestProcessStatus(COMMON.LOADING);
    }

    vscode.postMessage({
      ...requestData,
    });
  };

  useEffect(() => {
    if (requestMenuRef.current) {
      requestMenuRef.current.style.height = requestMenuHeight;
    }
  }, [requestMenuHeight]);

  // 添加curl导入相关状态
  const [isCurlInputVisible, setIsCurlInputVisible] = useState(false);
  const [curlInputValue, setCurlInputValue] = useState("");

  const handleCurlImportClick = () => {
    setIsCurlInputVisible(true);
  };

  const handleCurlSubmit = async () => {
    // 解析curl命令并生成请求
    const { method, url, headers, body } = await parseCurlCommand(
      curlInputValue,
    );
    // 更新store中的请求数据

    requestData.requestMethod = method;
    requestData.requestUrl = url;
    handleRequestUrlChange(url);
    handleRequestMethodChange(method);
    Object.entries(headers).forEach(([key, value], index) => {
      handleRequestKey(index, key);
      handleRequestValue(index, value);
    });
    handleRequestBodyOption("Raw");
    handleBodyRawOption("JSON");
    handleBodyRawOptionData("json", body?.toString() || "");
    console.log("Import: " + url);

    setIsCurlInputVisible(false);
    setCurlInputValue("");
  };

  return (
    <RequestPanelWrapper ref={requestMenuRef}>
      <RequestMainForm onSubmit={handleFormSubmit}>
        <RequestMethod />
        <RequestUrl />
        <RequestButton />
        {/* 添加curl导入按钮 */}
        <Button primary={false} handleButtonClick={handleCurlImportClick}>
          Curl导入
        </Button>
      </RequestMainForm>
      {isCurlInputVisible && (
        <div>
          <textarea
            value={curlInputValue}
            onChange={(e) => setCurlInputValue(e.target.value)}
            placeholder="输入curl命令"
          />
          <Button primary={false} handleButtonClick={handleCurlSubmit}>
            Import
          </Button>
        </div>
      )}
      <RequestDetailOption />
    </RequestPanelWrapper>
  );
};

// 解析 cURL 命令
async function parseCurlCommand(curlCommand: string): Promise<{
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}> {
  const methodMatch = curlCommand.match(/-X\s+(\w+)/);
  let method = methodMatch ? methodMatch[1] : "GET";

  const urlMatch = curlCommand.match(/['"]?(https?:\/\/[^\s'"\\]+)['"]?/);
  if (!urlMatch) {
    throw new Error("Invalid or missing URL in cURL command");
  }
  const url = urlMatch[1];

  const headerMatches = [
    ...curlCommand.matchAll(/-H\s+['"]([^:]+):\s?([^'"]+)['"]/g),
  ];
  const headers: Record<string, string> = {};
  for (const match of headerMatches) {
    headers[match[1].trim()] = match[2].trim();
  }

  const bodyMatch = curlCommand.match(/--data(?:-raw)?\s+['"](.*)['"]/ms);
  let body = "";
  if (bodyMatch) {
    const _body = bodyMatch ? bodyMatch[1] : undefined;
    try {
      body = JSON.stringify(JSON.parse(_body ? _body : ""));
    } catch (e) {
      body = _body || "";
    }
  } else {
    const bodyMatch = curlCommand.match(/(?:-d|--raw)\s+['"](.*)['"]/ms);
    const _body = bodyMatch ? bodyMatch[1] : undefined;
    try {
      body = JSON.stringify(JSON.parse(_body ? _body : ""));
    } catch (e) {
      body = _body || "";
    }
  }

  // 如果有请求体，调整使用 POST 方法
  if (body && body.length > 0) {
    method = "POST";
  }

  return { method, url, headers, body };
}

const RequestPanelWrapper = styled.div`
  margin: 5.5rem 5rem 1.5rem 5rem;
  overflow: hidden;
`;

const RequestMainForm = styled.form`
  display: flex;
`;

export default RequestPanel;
