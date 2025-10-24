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
const http = require("http");
const { initSocket, getIo } = require("./config/socket");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// routes
app.use("/api/users", userRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/products", productRouter);
app.use("/api/notifications", notificationRouter);

// global error handler
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
