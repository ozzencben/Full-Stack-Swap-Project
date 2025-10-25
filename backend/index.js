require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const userRouter = require("./routes/user");
const addressRouter = require("./routes/address");
const productRouter = require("./routes/product");
const notificationRouter = require("./routes/notification");
const tradeRouter = require("./routes/trades");
const http = require("http");
const { initSocket, getIo } = require("./config/socket");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));

// routes
app.get("/", (req, res) => {
  const accept = req.headers.accept || "";

  if (accept.includes("text/html")) {
    // Tarayıcıdan açılırsa HTML döndür
    res.send(`
      <html>
        <head>
          <title>Swapify Backend</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f9; color: #333; padding: 40px; }
            h1 { color: #4a90e2; }
            ul { line-height: 1.6; }
            a { color: #4a90e2; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Swapify Backend is Live</h1>
          <p>Use the following API endpoints:</p>
          <ul>
            <li><a href="/api/users">/api/users</a></li>
            <li><a href="/api/addresses">/api/addresses</a></li>
            <li><a href="/api/products">/api/products</a></li>
            <li><a href="/api/notifications">/api/notifications</a></li>
            <li><a href="/api/trades">/api/trades</a></li>
          </ul>
          <p>Try using a tool like <a href="https://www.postman.com/">Postman</a> or your frontend to interact with APIs.</p>
        </body>
      </html>
    `);
  } else {
    // API isteği ise JSON döndür
    res.json({
      success: true,
      message: "Backend is live. Use /api/ endpoints.",
    });
  }
});

app.use("/api/users", userRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/products", productRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/trades", tradeRouter);

// global error handler
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
