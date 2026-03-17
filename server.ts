import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as db from "./server-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ============================================================
  // API Routes - Customers
  // ============================================================

  app.get("/api/customers", (req, res) => {
    res.json(db.getCustomers());
  });

  app.get("/api/customers/:id", (req, res) => {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  });

  app.post("/api/customers", (req, res) => {
    const customer = db.addCustomer(req.body);
    res.status(201).json(customer);
  });

  app.put("/api/customers/:id", (req, res) => {
    const customer = db.updateCustomer(req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  });

  app.delete("/api/customers/:id", (req, res) => {
    db.deleteCustomer(req.params.id);
    res.json({ ok: true });
  });

  // ============================================================
  // API Routes - Tax Records
  // ============================================================

  app.get("/api/customers/:id/tax-records", (req, res) => {
    res.json(db.getTaxRecords(req.params.id));
  });

  app.post("/api/customers/:id/tax-records", (req, res) => {
    const record = db.addTaxRecord({ ...req.body, customerId: req.params.id });
    res.status(201).json(record);
  });

  // ============================================================
  // API Routes - Notifications
  // ============================================================

  app.get("/api/notifications", (req, res) => {
    res.json(db.getNotifications());
  });

  app.post("/api/notifications", (req, res) => {
    const notif = db.addNotification(req.body);
    res.status(201).json(notif);
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    db.markNotificationRead(req.params.id);
    res.json({ ok: true });
  });

  app.put("/api/notifications/read-all", (req, res) => {
    db.markAllNotificationsRead();
    res.json({ ok: true });
  });

  // ============================================================
  // API Routes - Settings
  // ============================================================

  app.get("/api/settings", (req, res) => {
    res.json(db.getSettings());
  });

  app.put("/api/settings", (req, res) => {
    db.saveSettings(req.body);
    res.json({ ok: true });
  });

  // ============================================================
  // Telegram Proxy
  // ============================================================

  app.post("/api/telegram/send", async (req, res) => {
    let { botToken, chatId, text } = req.body;

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
        body: JSON.stringify({ chat_id: chatId, text }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        return res.status(200).json({
          ok: false,
          error: "Máy chủ Telegram trả về phản hồi không hợp lệ.",
          details: rawText.substring(0, 100),
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error("Telegram Proxy Exception:", error);
      return res.status(200).json({
        ok: false,
        error: "Lỗi kết nối hệ thống khi gọi Telegram.",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ============================================================
  // Frontend Serving
  // ============================================================

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
