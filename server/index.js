const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

//socket
const onlineUsers = {};
let online = [];
io.on("connect", (socket) => {
  socket.on("join", ({ user }, callback) => {
    // socket.join(user.uid); //-> for DM
    socket.join("app");
    console.log(`${user.displayName} is online`, user.uid, socket.id);
    onlineUsers[socket.id] = user.uid;
    online.push(user.uid);
    online = [...new Set(online)];
    io.to("app").emit("onlineUsers", {
      onlineUsers: online,
    });
    callback();
  });

  socket.on("joinRoom", ({ room }, callback) => {
    socket.join(room);
    callback();
  });

  socket.on(
    "sendMessage",
    ({ user, text, room, channel, sentAt }, callback) => {
      io.to(room).emit("message", {
        text,
        sender: user,
        room,
        channel,
        sentAt,
      });
      console.log("msg sent", text);
      callback();
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`${onlineUsers[socket.id]} disconnected due to`, reason);
    let index = online.indexOf(onlineUsers[socket.id]);
    if (index > -1) online.splice(index, 1);
    delete onlineUsers[socket.id];
    io.to("app").emit("onlineUsers", {
      onlineUsers: online,
    });
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log("Server is running at http://localhost:3000")
);
