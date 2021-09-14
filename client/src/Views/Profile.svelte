<script>
  import { XIcon } from "svelte-feather-icons";
  import { navigate } from "svelte-navigator";
  import { user } from "../utils/store";
</script>

<button
  class="icon-button close"
  title="Close"
  on:click={() => {
    navigate(-1);
  }}
>
  <XIcon />
</button>
<div class="profile">
  <h1>Account</h1>
  <div class="card">
    <div style="background-color: {$user.banner || '#000'};" class="banner" />
    <div class="card-head">
      <div class="flex">
        <img src={$user.photoURL} alt="pfp" class="pfp" />
        <h3>{$user.displayName}</h3>
      </div>
      <button>Edit</button>
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
    padding-top: 110px;
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
  .banner {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100px;
  }
  .close {
    position: fixed;
    top: 20px;
    right: 20px;
  }
  .size14 {
    color: hsl(0, 0%, 70%);
  }
</style>
