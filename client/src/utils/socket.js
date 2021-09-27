import io from "socket.io-client";

export const ENDPOINT =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";
console.log(ENDPOINT);
const socket = io(ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});

export const socketVC = io(`${ENDPOINT}/vc`, {
  transports: ["websocket", "polling", "flashsocket"],
});

export default socket;
