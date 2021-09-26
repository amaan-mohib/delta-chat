<script>
  import Channels from "./Channels.svelte";
  import RoomsBar from "./RoomsBar.svelte";
  import { collection, query, where, onSnapshot } from "firebase/firestore";
  import { onDestroy, onMount } from "svelte";
  import { db } from "../../utils/firebase";
  import { selectedRoom, user, menu, selectedVC } from "../../utils/store";
  import { useParams } from "svelte-navigator";
  import socket from "../../utils/socket";
  import { MenuIcon } from "svelte-feather-icons";

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

<div
  class="icon-button menu {$selectedVC ? 'color' : ''}"
  on:click={() => {
    $menu = !$menu;
  }}
>
  <MenuIcon />
</div>
<div class="side-nav {$menu ? 'side-nav-active' : ''}">
  <RoomsBar {rooms} />
  <Channels />
  <div
    class="with-menu"
    on:click={() => {
      $menu = false;
    }}
  />
</div>

<style>
  .side-nav {
    display: flex;
    height: 100%;
  }
  .with-menu {
    display: none;
  }
  @media only screen and (max-width: 865px) {
    .color {
      animation: bg 2s infinite;
    }
    @keyframes bg {
      0% {
        background-color: hsla(120, 100%, 50%, 50%);
      }
      40% {
        background-color: hsla(120, 100%, 45%, 50%);
      }
      100% {
        background-color: green;
      }
    }
    .with-menu {
      display: block;
      width: calc(100% - 240px - 72px);
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }
    .side-nav {
      transform: translateX(-100%);
      position: absolute;
      transition: transform 0.4s linear;
      left: -9999px;
      visibility: hidden;
    }
    .side-nav-active {
      width: 100%;
      visibility: unset;
      position: fixed;
      top: 0;
      left: 0;
      display: flex;
      transform: translateX(0%);
      transition: transform 0.4s linear;
      z-index: 100;
    }
    .menu {
      position: fixed;
      top: 5px;
      left: 10px;
    }
  }
</style>
