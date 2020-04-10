import http from "http";
import express from "express";
import socketio from "socket.io";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

type Member = string;
type JoinCode = string;

interface Party {
  host: Member;
  members: Member[];
}

let parties: Map<JoinCode, Party> = new Map();

/**
 * Generate 5 character alphanumeric code identifying the party
 */
const generateJoinCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

io.sockets.on("connection", (socket) => {
  socket.on("create_party", () => {
    const code = generateJoinCode();
    const party = { host: socket.id, members: [] };
    parties.set(code, party);
    console.log("new party", parties);
    socket.emit("join_code", code);
  });
  socket.on("join_party", (code) => {
    let party = parties.get(code);
    console.log("trying to join party with", code, party);
    if (party) {
      party.members.push(socket.id);
      parties.set(code, party);
      let channelId = party.members.length;
      socket.to(party.host).emit("new_player", socket.id, channelId);
      socket.emit("join_success", party.host, channelId);
      return;
    }
    socket.emit("join_failed");
  });
  // Following callbacks should have some form of authorization to
  // prevent non-player connections from WebRTC access to host
  socket.on("rtc_offer", (id, message) => {
    console.log(socket.id, "sent offer to", id);
    socket.to(id).emit("rtc_offer", socket.id, message);
  });
  socket.on("rtc_answer", (id, message) => {
    console.log(socket.id, "sent answer to", id);
    socket.to(id).emit("rtc_answer", socket.id, message);
  });
  socket.on("rtc_candidate", (id, message) => {
    console.log(socket.id, "sent candidate", message, "to", id);
    socket.to(id).emit("rtc_candidate", socket.id, message);
  });
});

server.listen(4000);
