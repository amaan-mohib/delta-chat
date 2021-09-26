<script>
  import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    writeBatch,
  } from "@firebase/firestore";

  import { onMount } from "svelte";
  import { LoaderIcon } from "svelte-feather-icons";

  import { navigate, useParams } from "svelte-navigator";
  import Loader from "../components/Loader.svelte";
  import { db } from "../utils/firebase";
  import socket from "../utils/socket";
  import { app, user } from "../utils/store";

  const params = useParams();
  let error = "";
  let room = null;
  let loading = false;
  let joining = false;

  $: roomID = $params.room;

  onMount(async () => {
    document.title = `Invite - ${app}`;
    loading = true;
    const roomRef = doc(db, "rooms", roomID);
    const roomSnap = await getDoc(roomRef);
    loading = false;
    if (roomSnap.exists()) {
      room = roomSnap.data();
    } else {
      error = "The Room you are looking for does not exists 🙁";
    }
  });

  const join = async () => {
    joining = true;
    try {
      const roomRef = doc(db, "rooms", roomID);
      const batch = writeBatch(db);
      batch.update(roomRef, {
        participants: arrayUnion($user.uid),
      });
      const userRef = doc(db, "users", $user.uid);
      batch.update(userRef, {
        rooms: arrayUnion(roomID),
      });

      socket.emit(
        "sendMessage",
        {
          user: { displayName: "admin" },
          text: `${$user.displayName} just joined in`,
          room: roomID,
          channel: room.general,
          sentAt: new Date().toLocaleDateString("en-IN"),
        },
        async () => {
          //storing in db
          const msgRef = doc(
            collection(db, `rooms/${roomID}/channels/${room.general}/messages`)
          );
          await setDoc(msgRef, {
            sender: { displayName: "admin" },
            text: `${$user.displayName} just joined in`,
            room: roomID,
            channel: room.general,
            id: msgRef.id,
            sentAt: serverTimestamp(),
          });
        }
      );

      await batch.commit();
      joining = false;
      navigate(`/${roomID}/${room.general}`);
    } catch (e) {
      console.error(e);
    }
  };
  const home = () => {
    navigate("/");
  };
</script>

<svelte:head>
  <title>
    {`Invite - ${app}`}
  </title>
</svelte:head>
<div class="main">
  <div class="dialog content">
    {#if loading}
      <Loader />
    {:else if room}
      <img
        src={room.img ||
          `https://avatars.dicebear.com/api/jdenticon/${room.name
            .split(" ")[0]
            .toLowerCase()}.svg`}
        alt="Room Icon"
        class="pfp"
      />
      <p class="grey-text size14">You've been invited to join</p>
      <h2>{room.name}</h2>
      <p class="size14">
        {room.participants.length}
        {room.participants.length > 1 ? "members" : "member"}
      </p>
      {#if $user.rooms.includes(roomID)}
        <button disabled class="btn">Already a member</button>
      {:else}
        <button class="btn" on:click={join}>
          {#if joining}
            <div class="loading"><LoaderIcon /></div>
          {:else}
            Accept Invitation
          {/if}</button
        >
      {/if}
    {:else}
      <h1>Oops!</h1>
      <p style="margin:20px 0">{error}</p>
      <button class="btn" on:click={home}>Continue</button>
    {/if}
  </div>
</div>

<style>
  .main {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .content {
    display: flex;
    flex-direction: column;
    padding: 20px;
    max-width: 480px;
    width: 90%;
    min-height: 300px;
    align-items: center;
    justify-content: center;
  }
  .content > * {
    margin: 5px 0;
  }
  .pfp {
    width: 80px;
    height: 80px;
  }
  .btn {
    width: 80%;
    margin-top: 20px;
  }
</style>
