import axios from "axios";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();

const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
    console.log("user joined room",roomId);

    socket.on("codeChange",({roomId,code})=>{
      socket.to(roomId).emit("codeUpdate",code);
    });


    socket.on("leaveRoom",()=>{
      if(currentRoom && currentUser){
        rooms.get(currentRoom).delete(currentUser)
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

        socket.leave(currentRoom)

        currentRoom = null;
        currentUser = null;
    }
  })

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });



  socket.on("languageChange",({roomId , language})=>{
    io.to(roomId).emit("languageUpdate",language)
  })
    socket.on("disconnect",()=>{
      if(currentRoom && currentUser){
        rooms.get(currentRoom).delete(currentUser)
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        console.log("user Disconnected");
        
      }
    })

    socket.on("compileCode", async ({ code, roomId, language, version }) => {
      if (rooms.has(roomId)) {
        try {
          const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
            language: language,
            version: version,
            files: [
              {
                content: code, 
              },
            ],
          });
    
         
          io.to(roomId).emit("codeResponse", {
            success: true,
            output: response.data.run.output,
          });
        } catch (error) {
          console.error("Compilation error:", error);
          io.to(roomId).emit("codeResponse", {
            success: false,
            error: error.message,
          });
        }
      } else {
        console.error("Room not found:", roomId);
        io.to(roomId).emit("codeResponse", {
          success: false,
          error: "Room not found",
        });
      }
    });
    
    
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log("server is working on port 5000");
});
