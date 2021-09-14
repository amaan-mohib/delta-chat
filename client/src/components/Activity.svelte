<script>
  import { onDestroy, onMount } from "svelte";
  import { collection, query, where, onSnapshot } from "firebase/firestore";
  import { db, logout } from "../utils/firebase";
  import socket from "../utils/socket";
  import { selectedRoom, onlineUsers } from "../utils/store";

  let allUsers = [];
  let online = [];
  let offline = [];

  let unsub;

  $: $selectedRoom, getAllUsers();

  function getAllUsers() {
    if ($selectedRoom.id) {
      const q = query(
        collection(db, "users"),
        where("rooms", "array-contains", $selectedRoom.id)
      );
      unsub = onSnapshot(q, (querySnapshot) => {
        allUsers = querySnapshot.docs.map((doc) => doc.data());
        console.log(allUsers);
        online = allUsers.filter((user) => $onlineUsers.includes(user.uid));
        offline = allUsers.filter((user) => !$onlineUsers.includes(user.uid));
      });
    }
  }

  onMount(() => {
    socket.on("onlineUsers", (data) => {
      $onlineUsers = data.onlineUsers;
      online = allUsers.filter((user) => $onlineUsers.includes(user.uid));
      offline = allUsers.filter((user) => !$onlineUsers.includes(user.uid));
      console.log($onlineUsers);
    });
  });

  onDestroy(() => {
    unsub && unsub();
  });
</script>

<div class="side-bar">
  <!-- Activity
  <button on:click={logout}>Log Out</button> -->
  {#if online.length > 0}
    <div class="members">
      <p>Online — {online.length}</p>
      <ul class="member-list">
        {#each online as u (u.uid)}
          <li class="member">
            <img class="pfp" src={u.photoURL} alt={u.displayName} />
            <span class="size14 medium-text">{u.displayName}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  {#if offline.length > 0}
    <div class="members">
      <p>Offline — {offline.length}</p>
      <ul class="member-list">
        {#each offline as u (u.uid)}
          <li class="member offline">
            <img class="pfp" src={u.photoURL} alt={u.displayName} />
            <span class="size14 medium-text">{u.displayName}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .side-bar {
    width: 240px;
    background-color: hsl(0, 0%, 20%);
    color: hsl(0, 0%, 95%);
    padding: 10px;
  }
  .members {
    display: flex;
    flex-direction: column;
    width: 100%;
    text-overflow: ellipsis;
    overflow-x: hidden;
    margin-bottom: 10px;
  }
  .member-list {
    list-style: none;
    display: flex;
    flex-direction: column;
  }
  .member {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    border-radius: 5px;
    padding: 10px;
  }
  .member:hover {
    cursor: pointer;
    background-color: hsl(0, 0%, 25%);
    filter: brightness(1);
  }
  .pfp {
    margin-right: 8px;
  }
  .offline {
    filter: brightness(50%);
  }
</style>
