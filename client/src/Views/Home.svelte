<script>
  import { isInVC, selectedChannel } from "../utils/store";

  import Chat from "./Chat.svelte";
  import VC from "./VC.svelte";
  import Friends from "./Friends.svelte";
  import Navbar from "./Navbar/Navbar.svelte";
</script>

<Navbar />
{#if $selectedChannel.id === "friends"}
  <Friends />
{:else}
  <Chat />
{/if}
