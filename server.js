"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var http_1 = __importDefault(require("http"));
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var app = express_1["default"]();
var server = http_1["default"].createServer(app);
var io = socket_io_1["default"](server);
var parties = new Map();
/**
 * Generate 5 character alphanumeric code identifying the party
 */
var generateJoinCode = function () {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
};
io.sockets.on("connection", function (socket) {
    socket.on("create_party", function () {
        var code = generateJoinCode();
        var party = { host: socket.id, members: [] };
        parties.set(code, party);
        console.log("new party", parties);
        socket.emit("join_code", code);
    });
    socket.on("join_party", function (code) {
        var party = parties.get(code);
        console.log("trying to join party with", code, party);
        if (party) {
            party.members.push(socket.id);
            parties.set(code, party);
            var channelId = party.members.length;
            socket.to(party.host).emit("new_player", socket.id, channelId);
            socket.emit("join_success", party.host, channelId);
            return;
        }
        socket.emit("join_failed");
    });
    // Following callbacks should have some form of authorization to
    // prevent non-player connections from WebRTC access to host
    socket.on("rtc_offer", function (id, message) {
        console.log(socket.id, "sent offer to", id);
        socket.to(id).emit("rtc_offer", socket.id, message);
    });
    socket.on("rtc_answer", function (id, message) {
        console.log(socket.id, "sent answer to", id);
        socket.to(id).emit("rtc_answer", socket.id, message);
    });
    socket.on("rtc_candidate", function (id, message) {
        console.log(socket.id, "sent candidate", message, "to", id);
        socket.to(id).emit("rtc_candidate", socket.id, message);
    });
});
server.listen(4000);
