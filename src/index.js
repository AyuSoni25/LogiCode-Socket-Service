const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const redisCache = new Redis();
const app = express();
app.use(bodyParser.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5500',
        methods: ['GET', 'POST']
    }
});

//Socket connections
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on('setUserId', (userId)=>{
    redisCache.set(userId, socket.id)
  });

  socket.on('getConnectionId', async (userId)=>{
    const connId = await redisCache.get(userId);
    socket.emit('connectionId', connId);
  })
});

// http connections
app.post('/sendPayload', async (req, res) => {
    const {userId, payload} = req.body;
    if(!userId || !payload){
        return res.status(400).send('Invalid Request');
    }
    const socketId = await redisCache.get(userId);
    if(socketId){
        io.to(socketId).emit('submissionPayloadResponse', payload);
        return res.send('Payload sent successfully')
    } else {
        return res.status(400).send('User not connected');
    }
})

server.listen(3001, () => {
  console.log('server running at http://localhost:3001');
});