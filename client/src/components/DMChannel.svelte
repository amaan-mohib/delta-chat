<script>
  import { selectedDM } from "../utils/store";

  export let pfp;
  export let name;
  export let id;
</script>

<div
  class="channel vc {$selectedDM && id === $selectedDM.id ? 'active' : ''}"
  on:click
>
  <img src={pfp} alt={name} class="pfp" />
  <p>
    {name}
  </p>
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
  .vc {
    padding: 5px;
  }
  .vc > p {
    font-size: 12px;
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
  .pfp {
    width: 25px;
    height: 25px;
    margin-right: 10px;
  }
</style>
