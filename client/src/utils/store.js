import { writable } from "svelte/store";

export const user = writable(null);
export const onlineUsers = writable([]);
export const selectedRoom = writable({ id: "me", name: "Home" });
export const selectedChannel = writable({
  id: "friends",
  name: "Friends",
  typeIcon: "👥",
});
export const selectedVC = writable(null);
export const isInVC = writable(false);
export const usersInVC = writable([]);
export const selectedDM = writable(null);
export const dmList = writable([]);
