const fs = require("fs");
const http = require("http");
const https = require("https");
const net = require("net");
const path = require("path");

const targetHost = process.env.PROXY_TARGET_HOST || "127.0.0.1";
const targetPort = Number(process.env.PROXY_TARGET_PORT || "3000");
const listenHost = process.env.HTTPS_PROXY_HOST || "0.0.0.0";
const listenPort = Number(process.env.HTTPS_PROXY_PORT || "3443");
const certDir = process.env.HTTPS_CERT_DIR || path.join(process.cwd(), "certs");
const keyPath = process.env.HTTPS_KEY_PATH || path.join(certDir, "local-ip.key");
const certPath = process.env.HTTPS_CERT_PATH || path.join(certDir, "local-ip.crt");

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error(`Missing HTTPS certificate files.
Expected:
- ${keyPath}
- ${certPath}`);
  process.exit(1);
}

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  (req, res) => {
    const upstream = http.request(
      {
        host: targetHost,
        port: targetPort,
        method: req.method,
        path: req.url,
        headers: req.headers,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstream.on("error", (error) => {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`HTTPS proxy upstream error: ${error.message}`);
    });

    req.pipe(upstream);
  },
);

server.on("upgrade", (req, socket, head) => {
  const upstreamSocket = net.connect(targetPort, targetHost, () => {
    let headers = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (const [key, value] of Object.entries(req.headers)) {
      headers += `${key}: ${value}\r\n`;
    }
    headers += "\r\n";
    upstreamSocket.write(headers);
    if (head && head.length) {
      upstreamSocket.write(head);
    }
    socket.pipe(upstreamSocket).pipe(socket);
  });

  upstreamSocket.on("error", () => {
    socket.destroy();
  });
});

server.listen(listenPort, listenHost, () => {
  console.log(`HTTPS proxy ready: https://127.0.0.1:${listenPort}`);
  console.log(`LAN HTTPS proxy: https://192.168.110.169:${listenPort}`);
  console.log(`Proxy target: http://${targetHost}:${targetPort}`);
});
