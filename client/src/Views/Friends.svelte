<script>
  import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    where,
    writeBatch,
    updateDoc,
  } from "@firebase/firestore";

  import { onDestroy, onMount } from "svelte";
  import { db } from "../utils/firebase";
  import socket from "../utils/socket";
  import { DialogOverlay, DialogContent } from "svelte-accessible-dialog";
  import {
    dmList,
    onlineUsers,
    selectedChannel,
    selectedDM,
    user,
  } from "../utils/store";
  import { XIcon } from "svelte-feather-icons";
  import NoFriends from "../assets/images/undraw_friends.svg";
  import NoRequests from "../assets/images/undraw_void.svg";

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
      const snap = await getDocs(
        query(
          collection(db, "users"),
          where("friends", "array-contains", $user.uid)
        )
      );
      friends = snap.docs.map((doc) => doc.data());
      online = friends.filter((user) => $onlineUsers.includes(user.uid));
      offline = friends.filter((user) => !$onlineUsers.includes(user.uid));
      // // console.log(online, offline);
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
  /*AKA sendReq*/
  const addFriend = async (uid) => {
    if (uid === $user.uid) {
      error = "Hey! that's you 😁";
    } else {
      if (friends.includes(uid)) {
        error = "Wait a minute, the user is already your friend! 🤨";
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
            close();
          } else {
            error = "The user you are looking for does not exists 🙁";
          }
        } catch (e) {
          console.error(e);
          error = "Oops! Something went wrong 🤕";
        }
      }
    }
  };
  const accept = async (friend) => {
    const batch = writeBatch(db);
    try {
      batch.update(doc(db, "users", $user.uid), {
        friends: arrayUnion(friend.uid),
      });
      batch.update(doc(db, "users", friend.uid), {
        friends: arrayUnion($user.uid),
      });
      batch.delete(doc(db, "users", $user.uid, "requests", friend.uid));
      await batch.commit();
      getFriends();
    } catch (e) {
      console.error(e);
    }
  };

  const changeURL = async (person) => {
    const participants = [person.uid, $user.uid].sort();
    const pair = participants.join("_");

    if (!$dmList.includes(person.uid)) {
      await updateDoc(doc(db, "users", person.uid), {
        dms: arrayUnion($user.uid),
      });
    }
    socket.emit("joinDM", { room: pair }, (error) => {
      if (error) console.error(error);
    });
    $selectedChannel = {};
    $selectedDM = {
      id: pair,
      name: person.displayName,
      pfp: person.photoURL,
    };
  };
  onMount(() => {
    getFriends();
    getRequests();
    socket.on("onlineUsers", (data) => {
      $onlineUsers = data.onlineUsers;
      online = friends.filter((user) => $onlineUsers.includes(user.uid));
      offline = friends.filter((user) => !$onlineUsers.includes(user.uid));
      // // console.log($onlineUsers, online);
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
            <div
              title="Click to copy ID"
              class="friend"
              on:click={() => {
                changeURL(u);
              }}
            >
              <div class="img">
                <img class="pfp" src={u.photoURL} alt={u.displayName} />
                <!-- <div class="onlineIcon" /> -->
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
            <div
              class="friend offline"
              on:click={() => {
                changeURL(u);
              }}
            >
              <div class="img">
                <img class="pfp" src={u.photoURL} alt={u.displayName} />
                <!-- <div class="offlineIcon" /> -->
              </div>
              <p class="size14">{u.displayName}</p>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="empty">
        <img src={NoFriends} alt="no friends" class="illustration" />
        <p class="size14">No friends yet. Hope you got a cat 😊</p>
      </div>
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
              <button
                class="btn-small"
                style="margin-top: 10px;"
                on:click={() => accept(u)}>Accept</button
              >
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="empty">
        <img src={NoRequests} class="illustration" alt="no requests" />
        <p class="size14">
          You are staring into the void. No Requests for now.
        </p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .chat {
    flex-direction: column;
    justify-content: unset;
  }
  .friends {
    width: 100%;
    padding-top: 40px;
    display: flex;
    padding: 10px;
    align-items: flex-start;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .friend {
    display: flex;
    padding: 10px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    margin: 10px;
  }
  .friend:hover {
    cursor: pointer;
    background-color: hsl(0, 0%, 20%);
  }
  .pfp {
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
    filter: brightness(0.65);
  }
  .empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 10px;
    text-align: center;
  }
  .illustration {
    margin-bottom: 40px;
  }
</style>
