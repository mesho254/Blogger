require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./Config/db');
const socketHandler = require('./socket');
const errorMiddleware = require('./MiddleWares/error.middleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./Routes/auth.routes'));
app.use('/api/users', require('./Routes/users.routes'));
app.use('/api/blogs', require('./Routes/blogs.routes'));
app.use('/api/comments', require('./Routes/comments.routes'));
app.use('/api/messages', require('./Routes/messages.routes'));
app.use('/api/admin', require('./Routes/admin.routes'));
app.use('/api/payments', require('./Routes/payments.routes')); // Added for PayPal

// Socket
socketHandler(io);

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});