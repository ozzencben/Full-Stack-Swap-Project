require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");


const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// global error handler
app.use(errorHandler);

port = 5000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});