<script>
  export let Close;

  import { XIcon } from "svelte-feather-icons";
  import { user } from "../utils/store";
  import Profile from "../components/Profile.svelte";
  import { logout } from "../utils/firebase";

  let isOpen = false;
  const open = () => {
    isOpen = true;
  };
  const close = () => {
    isOpen = false;
  };
</script>

<button class="icon-button close" title="Close" on:click={Close}>
  <XIcon />
</button>
<div class="profile">
  <h1>Account</h1>
  <div class="card">
    <div class="card-head">
      <div class="flex">
        <img src={$user.photoURL} alt="pfp" class="pfp" />
        <h3>{$user.displayName}</h3>
      </div>
      <div class="flex2">
        <button style="margin-bottom: 10px;" on:click={open}>Edit</button>
        <Profile Close={close} {isOpen} />
        <button class="btn-outline" on:click={logout}>Log Out</button>
      </div>
    </div>
    <div class="card2">
      <div class="info">
        <span class="size14">Name</span>
        <span>{$user.displayName}</span>
      </div>
      <div class="info">
        <span class="size14">Email</span>
        <span>{$user.email}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .profile {
    width: 90%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: auto;
  }
  .card,
  .card2 {
    position: relative;
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    background-color: hsl(0, 0%, 10%);
  }
  .card {
    overflow: hidden;
  }
  .card2 {
    background-color: hsl(0, 0%, 20%);
    width: 100%;
    align-items: start;
  }
  .card-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .flex {
    display: flex;
    align-items: center;
  }
  .info {
    display: flex;
    flex-direction: column;
  }
  .card2 > :global(:nth-child(even)) {
    margin-top: 20px;
  }
  .pfp {
    width: 90px;
    height: 90px;
    margin-right: 15px;
  }
  .close {
    position: fixed;
    top: 20px;
    right: 20px;
  }
  .size14 {
    color: hsl(0, 0%, 70%);
  }
  .flex2 {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }
</style>
