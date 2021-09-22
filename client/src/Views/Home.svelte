<script>
  import { selectedChannel, selectedDM } from "../utils/store";
  import Chat from "./Chat.svelte";
  import Dm from "./DM.svelte";
  import Friends from "./Friends.svelte";
  import Navbar from "./Navbar/Navbar.svelte";
</script>

<Navbar />
{#if $selectedChannel.id === "friends"}
  <Friends />
{:else if $selectedDM}
  <Dm />
{:else}
  <Chat />
{/if}
