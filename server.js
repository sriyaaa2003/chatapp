const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle joining rooms
    socket.on('joinRoom', ({ user, room }) => {
        socket.join(room);
        socket.to(room).emit('message', {
            user: { id: 'system', name: 'System' },
            text: `${user.name} has joined the room`,
            time: new Date().toISOString()
        });
        
        // Send users in room
        io.to(room).emit('roomUsers', {
            room: room,
            users: Array.from(io.sockets.adapter.rooms.get(room) || [])
        });
    });

    // Handle leaving rooms
    socket.on('leaveRoom', ({ user, room }) => {
        socket.leave(room);
        socket.to(room).emit('message', {
            user: { id: 'system', name: 'System' },
            text: `${user.name} has left the room`,
            time: new Date().toISOString()
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (message) => {
        io.to(message.room).emit('message', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
