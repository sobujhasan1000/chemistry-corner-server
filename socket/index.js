const express = require("express");
const app = express();
const port = process.env.PORT || 8800;
const io = require("socket.io")(port, {
  cors: { origin: "https://chemistry-corner-server.up.railway.app" },
});

let activeUsers = [];

io.on("connection", (socket) => {
  //add new user
  socket.on("new-user-add", (newUserId) => {
    //if user not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    console.log("Connected users", activeUsers);
    io.emit("get-users", activeUsers);
  });

  //   send message
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("sending from socket to: ", receiverId);
    console.log(data);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("users disconnected", activeUsers);
    io.emit("get-users", activeUsers);
  });
});

app.get("/", (req, res) => {
  res.send("chemistry corner socket server is running");
});

// app.listen(port, () => {
//   console.log(`chemistry corner socket server is running on port ☣️ ${port}`);
// });
