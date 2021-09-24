<script>
  export let rooms;
  import Room from "../../components/Room.svelte";
  import { PlusIcon, XIcon, HomeIcon, ImageIcon } from "svelte-feather-icons";
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
  import { db, storageRef } from "../../utils/firebase";
  import { isInVC, selectedRoom, user } from "../../utils/store";
  import socket from "../../utils/socket";
  import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
  import finalCompressedBlob from "../../utils/compressImage";

  let isOpen = false;
  const open = () => {
    isOpen = true;
  };
  const close = () => {
    isOpen = false;
    error = "";
  };

  let error = "";
  let isNext = false;
  let isCreateRoom = false;
  let roomName = "";
  let roomImg = "";
  let roomImgTemp = null;
  let roomID = "";
  let isImgLink = false;
  let preview;

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

  const uploadImage = (id) => {
    return new Promise((resolve, reject) => {
      if (roomImgTemp) {
        const typeArr = roomImgTemp.type.split("/");
        const type = roomImgTemp.type.split("/")[typeArr.length - 1];
        const uploadTask = uploadBytesResumable(
          ref(storageRef, "rooms/" + `${id}.${type}`),
          roomImgTemp
        );
        uploadTask.on(
          "state_changed",
          (ss) => {
            const progress = (ss.bytesTransferred / ss.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              console.log(url);
              roomImg = url;
              resolve();
            });
          }
        );
      } else {
        resolve();
      }
    });
  };

  const createRoom = async () => {
    try {
      const batch = writeBatch(db);
      const docRef = doc(collection(db, "rooms"));
      await uploadImage(docRef.id);
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
      roomImgTemp = null;
      roomID = "";
      isImgLink = false;
    } catch (e) {
      console.error(e);
      error = "Oops! Something went wrong 🤕";
    }
  };

  const join = async () => {
    if ($user.rooms.includes(roomID)) {
      error = "WDYM? You are already in the Room 🤔";
    } else {
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
                    `rooms/${roomID}/channels/${
                      roomSnap.data().general
                    }/messages`
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
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    preview.src = URL.createObjectURL(file);
    const compressedBlob = await finalCompressedBlob(file, preview);
    preview.src = URL.createObjectURL(compressedBlob);
    roomImgTemp = compressedBlob;
    URL.revokeObjectURL(preview);
  };
</script>

<div class="rooms">
  <Room
    id="me"
    name="Home"
    img={"none"}
    icon={HomeIcon}
    on:click={() => {
      $isInVC = false;
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
        $isInVC = false;
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
          <p class="size14 grey-text" style="margin-bottom: 20px;">
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
          <p class="size14 grey-text" style="margin-bottom: 20px;">
            Personalize your Room, with a name and an optional Room Icon
          </p>
          {#if isImgLink}
            <input
              bind:value={roomImg}
              type="text"
              placeholder="Room Image Link"
            />
          {:else}
            <div class="upload-parent">
              <img
                bind:this={preview}
                style="display: {roomImgTemp ? 'initial' : 'none'};"
                src=""
                alt="Room icon"
                class="roomImg"
              />
              {#if !roomImgTemp}
                <div class="upload">
                  <ImageIcon />
                </div>
                <div class="add-badge">
                  <PlusIcon />
                </div>
              {/if}

              <input
                class="input-image"
                type="file"
                accept="image/*"
                name="roomImg"
                on:change={handleUpload}
              />
            </div>
          {/if}
          <span
            class="option grey-text"
            on:click={() => {
              isImgLink = !isImgLink;
              roomImgTemp = null;
              roomImg = "";
            }}
            >{isImgLink
              ? "Choose an image instead"
              : "Enter an image link instead"}</span
          >
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
                isImgLink = false;
              }}>Back</button
            >
            <button disabled={roomName.trim() === ""} on:click={createRoom}
              >Create</button
            >
          </div>
        {:else}
          <h2>Join a Room</h2>
          <p class="size14 grey-text" style="margin-bottom: 20px;">
            Enter a Room ID to join an existing server
          </p>
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
    overflow: hidden auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  .rooms::-webkit-scrollbar {
    width: 0;
    height: 0;
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
  .upload-parent {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 5px auto;
  }
  .upload {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px dashed;
    padding: 23px;
  }
  .input-image {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .add-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 26px;
    height: 26px;
    padding: 3px;
    border-radius: 50%;
    background-color: hsl(0, 0%, 15%);
    box-shadow: 0 0 0 3px hsl(0deg 0% 20%);
  }
  .option {
    font-size: 12px;
    text-align: center;
  }
  .option:hover {
    cursor: pointer;
    text-decoration: underline;
  }
  .roomImg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
</style>
