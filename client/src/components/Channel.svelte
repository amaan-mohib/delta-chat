<script>
  import { selectedChannel } from "../utils/store";

  export let type;
  export let name;
  export let id;
</script>

<div class="channel {id === $selectedChannel.id ? 'active' : ''}" on:click>
  <span class="channel-icon">{type}</span>
  <span>{name}</span>
</div>

<style>
  .channel {
    display: flex;
    align-items: center;
    justify-content: start;
    padding: 10px;
    border-radius: 5px;
    color: hsl(0, 0%, 70%);
  }
  .channel-icon {
    margin-right: 10px;
  }
  .channel:hover,
  .active {
    cursor: pointer;
    background-color: hsl(0, 0%, 25%);
    color: hsl(0, 0%, 95%);
  }
  .channel:active {
    background-color: hsl(0, 0%, 30%);
  }
  .active {
    margin-bottom: 1px;
  }
</style>
