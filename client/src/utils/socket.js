import io from "socket.io-client";

export const ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://delta-chat.onrender.com"
    : "http://localhost:3000";

const socket = io(ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});

export const socketVC = io(`${ENDPOINT}/vc`, {
  transports: ["websocket", "polling", "flashsocket"],
});

export default socket;
