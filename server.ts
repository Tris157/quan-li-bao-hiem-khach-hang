import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Telegram Proxy
  app.post("/api/telegram/send", async (req, res) => {
    let { botToken, chatId, text } = req.body;

    // Sanitize inputs
    botToken = botToken?.toString().trim();
    chatId = chatId?.toString().trim();

    if (!botToken || !chatId || !text) {
      return res.status(400).json({ error: "Thiếu thông tin: Token, Chat ID hoặc nội dung tin nhắn." });
    }

    try {
      console.log(`Attempting to send Telegram message to ${chatId}`);
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        return res.status(200).json({ 
          ok: false,
          error: "Máy chủ Telegram trả về phản hồi không hợp lệ (không phải JSON).",
          details: rawText.substring(0, 100)
        });
      }

      // Always return 200 to the client to avoid infrastructure interception of 4xx/5xx
      // The client will check the 'ok' field in the Telegram response
      return res.status(200).json(data);
    } catch (error) {
      console.error("Telegram Proxy Exception:", error);
      return res.status(200).json({ 
        ok: false,
        error: "Lỗi kết nối hệ thống khi gọi Telegram.",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
