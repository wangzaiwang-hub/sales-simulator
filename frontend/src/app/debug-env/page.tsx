"use client";

export default function DebugEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const clientId = process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI;

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>环境变量调试</h1>
      <div style={{ marginTop: "20px" }}>
        <h2>NEXT_PUBLIC_API_URL:</h2>
        <pre style={{ background: "#f0f0f0", padding: "10px" }}>
          {apiUrl || "未设置"}
        </pre>

        <h2>NEXT_PUBLIC_SECONDME_CLIENT_ID:</h2>
        <pre style={{ background: "#f0f0f0", padding: "10px" }}>
          {clientId || "未设置"}
        </pre>

        <h2>NEXT_PUBLIC_SECONDME_REDIRECT_URI:</h2>
        <pre style={{ background: "#f0f0f0", padding: "10px" }}>
          {redirectUri || "未设置"}
        </pre>

        <h2>测试资源URL:</h2>
        <pre style={{ background: "#f0f0f0", padding: "10px" }}>
          {apiUrl
            ? `${apiUrl}/resource/test.png`
            : "API URL 未设置，将使用本地路径"}
        </pre>
      </div>
    </div>
  );
}
