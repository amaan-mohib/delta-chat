<script>
  import { selectedRoom } from "../utils/store";

  export let img = "";
  export let name = "";
  export let icon = false;
  export let id = "";

  $: selectedID = $selectedRoom.id || null;
</script>

<div class="room {id === selectedID ? 'active' : ''}" on:click title={name}>
  {#if icon}
    <div class="room-icon icon">
      <svelte:component this={icon} />
    </div>
  {:else}
    <img
      class="room-icon"
      src={img
        ? img
        : `https://avatars.dicebear.com/api/jdenticon/${name
            .split(" ")[0]
            .toLowerCase()}.svg`}
      alt={name}
    />
  {/if}
  <span style="display: none;">{name}</span>
</div>

<style>
  .room {
    display: flex;
    padding: 5px 0;
  }
  .room-icon {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 50%;
    transition-duration: 0.4s;
  }
  .icon {
    background-color: hsl(0, 0%, 20%);
    padding: 10px;
  }
  .icon:hover {
    background-color: black;
  }
  .room-icon:hover {
    cursor: pointer;
    border-radius: 30%;
    background-color: black;
  }
  .room-icon:active {
    transform: scale(0.9);
  }
  .active {
    padding: 5px;
    border-radius: 30%;
    box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.5);
    background-color: hsl(0, 0%, 95%);
    margin: 5px 0;
  }
</style>
