require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const { initSocket } = require('./src/socket/socketHandler');

const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const statusRoutes = require('./src/routes/statusRoutes');
const callRoutes = require('./src/routes/callRoutes');
const blockRoutes = require('./src/routes/blockRoutes');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/blocks', blockRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || '*' } });
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Flare backend running on port ${PORT}`));