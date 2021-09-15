<script>
  import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    writeBatch,
  } from "@firebase/firestore";

  import { onDestroy, onMount } from "svelte";
  import { db } from "../utils/firebase";
  import socket from "../utils/socket";
  import { DialogOverlay, DialogContent } from "svelte-accessible-dialog";
  import { onlineUsers, selectedChannel, user } from "../utils/store";
  import { XIcon } from "svelte-feather-icons";

  let isOpen = false;
  const open = () => {
    isOpen = true;
  };
  const close = () => {
    isOpen = false;
  };

  let friends = [];
  let online = [];
  let offline = [];
  let requests = [];
  let uid = "";
  let error = "";
  const tabs = ["All", "Requests"];
  let tabIndex = 0;
  let requnsub;

  const getFriends = async () => {
    try {
      const snap = await getDocs(collection(db, "users", $user.uid, "friends"));
      friends = snap.docs.map((doc) => doc.data());
      online = friends.filter((user) => $onlineUsers.includes(user.uid));
      offline = friends.filter((user) => !$onlineUsers.includes(user.uid));
      console.log(online, offline);
    } catch (e) {
      console.error(e);
    }
  };
  const getRequests = async () => {
    try {
      const q = query(collection(db, "users", $user.uid, "requests"));
      requnsub = onSnapshot(q, (ss) => {
        requests = ss.docs.map((doc) => doc.data());
      });
    } catch (e) {
      console.error(e);
    }
  };
  const addFriend = async (uid) => {
    if (uid === $user.uid) {
      error = "Hey! that's you 😁";
    } else {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          await setDoc(doc(db, "users", uid, "requests", $user.uid), {
            uid: $user.uid,
            displayName: $user.displayName,
            photoURL: $user.photoURL,
            email: $user.email,
          });

          getFriends();
          close();
        } else {
          error = "The user you are looking for does not exists 🙁";
        }
      } catch (e) {
        console.error(e);
        error = "Oops! Something went wrong 🤕";
      }
    }
  };
  const accept = async (friend) => {
    const batch = writeBatch(db);
    try {
      batch.set(doc(db, "users", $user.uid, "friends", friend.uid), {
        uid: friend.uid,
        displayName: friend.displayName,
        photoURL: friend.photoURL,
        email: friend.email,
      });
      batch.set(doc(db, "users", friend.uid, "friends", $user.uid), {
        uid: $user.uid,
        displayName: $user.displayName,
        photoURL: $user.photoURL,
        email: $user.email,
      });
      batch.delete(doc(db, "users", $user.uid, "requests", friend.uid));
      await batch.commit();
      getFriends();
    } catch (e) {
      console.error(e);
    }
  };
  onMount(() => {
    getFriends();
    getRequests();
    socket.on("onlineUsers", (data) => {
      $onlineUsers = data.onlineUsers;
      online = friends.filter((user) => $onlineUsers.includes(user.uid));
      offline = friends.filter((user) => !$onlineUsers.includes(user.uid));
      console.log($onlineUsers, online);
    });
  });
  onDestroy(() => {
    requnsub && requnsub();
  });
</script>

<div class="chat">
  <header>
    <span>
      {$selectedChannel.typeIcon}
      {$selectedChannel.name}
    </span>
    {#if $selectedChannel.id === "friends"}
      <button class="btn-small" on:click={open}>Add Friend</button>
      <DialogOverlay {isOpen} onDismiss={close}>
        <DialogContent aria-label="Add Friend" class="dialog">
          <button
            on:click={close}
            class="icon-button x-icon"
            style="align-self: flex-end;"
          >
            <XIcon />
          </button>
          <div class="content">
            <h2>Add Friend</h2>
            <input
              type="text"
              bind:value={uid}
              placeholder="Enter the Friend ID"
            />
            <button
              on:click={() => {
                if (uid.trim() !== "") addFriend(uid);
              }}
              disabled={uid.trim() === ""}>Send Friend Request</button
            >
            {#if error}
              <p class="size14">{error}</p>
            {/if}
          </div>
        </DialogContent>
      </DialogOverlay>
    {/if}
  </header>
  <div class="tabs">
    {#each tabs as tab, index}
      <div
        class="tab {tabIndex === index ? 'tab-active' : ''}"
        on:click={() => {
          tabIndex = index;
        }}
      >
        {tab}
      </div>
    {/each}
  </div>
  {#if tabIndex === 0}
    {#if friends.length > 0}
      {#if online.length > 0}
        <p class="title">Online — {online.length}</p>
        <div class="friends">
          {#each online as u}
            <div class="friend">
              <div class="img">
                <img class="pfp" src={u.photoURL} alt={u.displayName} />
                <div class="onlineIcon" />
              </div>
              <p class="size14">{u.displayName}</p>
            </div>
          {/each}
        </div>
      {/if}
      {#if offline.length > 0}
        <p class="title">Offline — {offline.length}</p>
        <div class="friends">
          {#each offline as u}
            <div class="friend offline">
              <div class="img">
                <img class="pfp" src={u.photoURL} alt={u.displayName} />
                <div class="offlineIcon" />
              </div>
              <p class="size14">{u.displayName}</p>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div>No friends...</div>
    {/if}
  {/if}
  {#if tabIndex === 1}
    {#if requests.length > 0}
      {#if requests.length > 0}
        <p class="title">Requests — {requests.length}</p>
        <div class="friends">
          {#each requests as u}
            <div class="friend">
              <img class="pfp" src={u.photoURL} alt={u.displayName} />
              <p class="size14">{u.displayName}</p>
              <button style="margin-top: 10px;" on:click={() => accept(u)}
                >Accept</button
              >
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div>No Requests...</div>
    {/if}
  {/if}
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    background-color: hsl(0, 0%, 25%);
    width: 100%;
    height: 100%;
    padding-top: 40px;
  }
  header {
    position: fixed;
    top: 0;
    height: 40px;
    padding: 10px;
    border-bottom: 1px solid hsl(0, 0%, 15%);
    width: calc(100% - 72px - 240px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .friends {
    width: 100%;
    height: 100%;
    padding-top: 40px;
    display: flex;
    padding: 10px;
    align-items: flex-start;
    justify-content: flex-start;
  }
  .friend {
    display: flex;
    padding: 10px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
  }
  .friend:hover {
    cursor: pointer;
    background-color: hsl(0, 0%, 20%);
  }
  .friend > .img {
    margin-bottom: 5px;
  }
  .content {
    max-width: 400px;
    display: flex;
    flex-direction: column;
    padding: 20px;
    width: 100%;
    text-align: center;
  }
  .content > * {
    margin: 10px 0;
  }
  .tabs {
    display: flex;
    width: 100%;
    padding: 10px;
    align-items: center;
  }
  .tab {
    padding: 5px 15px;
    border-radius: 5px;
    margin-right: 10px;
  }
  .tab:hover,
  .tab-active {
    cursor: pointer;
    background-color: hsl(0, 0%, 20%);
  }
  .title {
    padding: 10px;
  }
  .offline {
    filter: brightness(0.5);
  }
</style>
