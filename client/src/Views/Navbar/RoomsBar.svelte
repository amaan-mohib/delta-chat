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
    getDoc,
    serverTimestamp,
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
    error = "";
  };

  let error = "";
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
      const batch = writeBatch(db);
      const docRef = doc(collection(db, "rooms"));
      batch.set(docRef, {
        id: docRef.id,
        name: roomName,
        img: roomImg,
        participants: arrayUnion($user.uid),
      });
      console.log("added", docRef.id);

      const userRef = doc(db, "users", $user.uid);
      batch.update(userRef, {
        rooms: arrayUnion(docRef.id),
      });
      channels.forEach((channel) => {
        const channelRef = doc(collection(db, `${docRef.path}/channels`));
        batch.set(channelRef, {
          id: channelRef.id,
          ...channel,
        });
        if (channel.type === "text") {
          batch.update(doc(db, "rooms", docRef.id), {
            general: channelRef.id,
          });
        }
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
      error = "Oops! Something went wrong 🤕";
    }
  };

  const join = async () => {
    const snap = await getDoc(doc(db, "rooms", roomID));
    if (snap.exists()) {
      try {
        const batch = writeBatch(db);
        const docRef = doc(db, "rooms", roomID);
        batch.update(docRef, {
          participants: arrayUnion($user.uid),
        });
        const userRef = doc(db, "users", $user.uid);
        batch.update(userRef, {
          rooms: arrayUnion(roomID),
        });

        const roomSnap = await getDoc(docRef);
        if (roomSnap.exists()) {
          socket.emit(
            "sendMessage",
            {
              user: { displayName: "admin" },
              text: `${$user.displayName} just joined in`,
              room: roomID,
              channel: roomSnap.data().general,
              sentAt: new Date().toLocaleDateString("en-IN"),
            },
            async () => {
              //storing in db
              const msgRef = doc(
                collection(
                  db,
                  `rooms/${roomID}/channels/${roomSnap.data().general}/messages`
                )
              );
              await setDoc(msgRef, {
                sender: { displayName: "admin" },
                text: `${$user.displayName} just joined in`,
                room: roomID,
                channel: roomSnap.data().general,
                id: msgRef.id,
                sentAt: serverTimestamp(),
              });
            }
          );
        }
        await batch.commit();
        close();
        isNext = false;
        isCreateRoom = false;
        roomName = "";
        roomImg = "";
        roomID = "";
      } catch (e) {
        console.error(e);
        error = "Oops! Something went wrong 🤕";
      }
    } else {
      error = "The Room you are looking for does not exists 🙁";
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
          <p class="size14" style="margin-bottom: 20px;">
            Or a join a Room, if you have the ID already
          </p>
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
          <h2>Create a Room</h2>
          <input
            bind:value={roomImg}
            type="text"
            placeholder="Room Image Link"
          />
          <input bind:value={roomName} type="text" placeholder="Room Name" />
          {#if error}
            <p class="size14">{error}</p>
          {/if}
          <div class="btn-bar">
            <button
              on:click={() => {
                isCreateRoom = false;
                isNext = false;
                error = "";
              }}>Back</button
            >
            <button disabled={roomName.trim() === ""} on:click={createRoom}
              >Create</button
            >
          </div>
        {:else}
          <h2>Join a Room</h2>
          <input bind:value={roomID} type="text" placeholder="Room ID" />
          {#if error}
            <p class="size14">{error}</p>
          {/if}
          <div class="btn-bar">
            <button
              on:click={() => {
                isCreateRoom = false;
                isNext = false;
                error = "";
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
