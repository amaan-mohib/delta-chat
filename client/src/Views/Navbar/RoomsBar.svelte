<script>
  export let rooms;
  import Room from "../../components/Room.svelte";
  import { PlusIcon, XIcon, HomeIcon } from "svelte-feather-icons";
  import { DialogOverlay, DialogContent } from "svelte-accessible-dialog";
  import {
    collection,
    setDoc,
    arrayUnion,
    doc,
    writeBatch,
    updateDoc,
  } from "firebase/firestore";
  import { db } from "../../utils/firebase";
  import { selectedRoom, user } from "../../utils/store";
  import socket from "../../utils/socket";

  let isOpen = false;
  const open = () => {
    isOpen = true;
  };
  const close = () => {
    isOpen = false;
  };

  // const rooms = [
  //   {
  //     name: "first",
  //     img: "https://cdn.discordapp.com/avatars/559704479990153217/8ed644c0f450b6dccd2d058a4df79cb6.png?size=256",
  //   },
  // ];

  let isNext = false;
  let isCreateRoom = false;
  let roomName = "";
  let roomImg = "";
  let roomID = "";

  const channels = [
    {
      name: "general",
      type: "text",
      category: "text channels",
      typeIcon: "✏️",
    },
    {
      name: "general",
      type: "voice",
      category: "voice channels",
      typeIcon: "🔊",
    },
  ];

  const createRoom = async () => {
    try {
      const docRef = doc(collection(db, "rooms"));
      await setDoc(docRef, {
        id: docRef.id,
        name: roomName,
        img: roomImg,
        participants: arrayUnion($user.uid),
      });
      console.log("added", docRef.id);
      try {
        const userRef = doc(db, "users", $user.uid);
        await updateDoc(userRef, {
          rooms: arrayUnion(docRef.id),
        });
      } catch (e) {
        console.error(e);
      }
      try {
        const batch = writeBatch(db);
        channels.forEach((channel) => {
          const channelRef = doc(collection(db, `${docRef.path}/channels`));
          batch.set(channelRef, {
            id: channelRef.id,
            ...channel,
          });
        });
        await batch.commit();
        close();
        isNext = false;
        isCreateRoom = false;
        roomName = "";
        roomImg = "";
        roomID = "";
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const join = async () => {
    try {
      const docRef = doc(db, "rooms", roomID);
      await updateDoc(docRef, {
        participants: arrayUnion($user.uid),
      });
      try {
        const userRef = doc(db, "users", $user.uid);
        await updateDoc(userRef, {
          rooms: arrayUnion(roomID),
        });
      } catch (e) {
        console.error(e);
      }
      close();
      isNext = false;
      isCreateRoom = false;
      roomName = "";
      roomImg = "";
      roomID = "";
    } catch (e) {
      console.error(e);
    }
  };
</script>

<div class="rooms">
  <Room
    id="me"
    name="Home"
    img={"none"}
    icon={HomeIcon}
    on:click={() => {
      $selectedRoom = { id: "me", name: "Home" };
    }}
  />
  {#each rooms as room (room.id)}
    <Room
      id={room.id}
      name={room.name}
      img={room.img}
      icon={false}
      on:click={() => {
        $selectedRoom = room;
        socket.emit("joinRoom", { room: room.id }, (error) => {
          if (error) console.error(error);
        });
      }}
    />
  {/each}
  <Room
    id="add"
    name="Add a room"
    img={"none"}
    icon={PlusIcon}
    on:click={open}
  />
  <DialogOverlay {isOpen} onDismiss={close}>
    <DialogContent
      aria-label="Add a server"
      class="dialog"
      style="text-align:center;"
    >
      <button
        on:click={close}
        class="icon-button x-icon"
        style="align-self: flex-end;"
      >
        <XIcon />
      </button>
      <div class="room-dialog">
        {#if !isNext}
          <h2>Create a Room</h2>
          <button
            on:click={() => {
              isCreateRoom = true;
              isNext = true;
            }}>Create</button
          >
          <button
            on:click={() => {
              isCreateRoom = false;
              isNext = true;
            }}>Join</button
          >
        {:else if isCreateRoom}
          <input
            bind:value={roomImg}
            type="text"
            placeholder="Room Image Link"
          />
          <input bind:value={roomName} type="text" placeholder="Room Name" />
          <div class="btn-bar">
            <button
              on:click={() => {
                isCreateRoom = false;
                isNext = false;
              }}>Back</button
            >
            <button disabled={roomName.trim() === ""} on:click={createRoom}
              >Create</button
            >
          </div>
        {:else}
          <input bind:value={roomID} type="text" placeholder="Room ID" />
          <div class="btn-bar">
            <button
              on:click={() => {
                isCreateRoom = false;
                isNext = false;
              }}>Back</button
            >
            <button disabled={roomID.trim() === ""} on:click={join}>Join</button
            >
          </div>
        {/if}
      </div>
    </DialogContent>
  </DialogOverlay>
</div>

<style>
  .rooms {
    display: flex;
    align-items: center;
    flex-direction: column;
    height: 100%;
    width: 72px;
    padding-top: 5px;
    background-color: hsl(0, 0%, 15%);
  }
  .room-dialog {
    margin-top: 10px;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .room-dialog > * {
    margin: 5px 0;
  }
  .btn-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }
</style>
