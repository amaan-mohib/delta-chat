<script>
  import Channels from "./Channels.svelte";
  import RoomsBar from "./RoomsBar.svelte";
  import { collection, query, where, onSnapshot } from "firebase/firestore";
  import { onDestroy, onMount } from "svelte";
  import { db } from "../../utils/firebase";
  import { selectedRoom, user } from "../../utils/store";
  import { useParams } from "svelte-navigator";
  import socket from "../../utils/socket";

  let unsub;
  let rooms = [];
  const params = useParams();

  $: roomID = $params.room;

  onMount(() => {
    const q = query(
      collection(db, "rooms"),
      where("participants", "array-contains", $user.uid)
    );
    unsub = onSnapshot(q, (querySnapshot) => {
      rooms = querySnapshot.docs.map((doc) => doc.data());
      // console.log(roomID);
      if (rooms.length > 0) {
        if (roomID !== "me") {
          let filteredRoom = rooms.filter((room) => room.id === roomID);
          $selectedRoom = filteredRoom.length > 0 ? filteredRoom[0] : rooms[0];
          console.log($selectedRoom);
          socket.emit("joinRoom", { room: $selectedRoom.id }, (error) => {
            if (error) console.error(error);
          });
        }
      }
      console.log(rooms);
    });
  });
  onDestroy(() => {
    unsub && unsub();
    $selectedRoom = { id: "me", name: "Home" };
  });
</script>

<div class="side-nav">
  <RoomsBar {rooms} />
  <Channels />
</div>

<style>
  .side-nav {
    display: flex;
    height: 100%;
  }
</style>
