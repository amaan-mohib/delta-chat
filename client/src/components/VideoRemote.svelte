<script>
  import { MicOffIcon } from "svelte-feather-icons";

  import { socketVC as socket } from "../utils/socket";
  import { selectedVC, usersInVC } from "../utils/store";

  export let peer;
  export let socketid;
  let userRemote;
  let video;
  let isMic = true;
  let isCam = true;

  $: peer &&
    peer.on("stream", (stream) => {
      video.srcObject = stream;
    });

  socket.on("onRemoveTrack", ({ sid, track }) => {
    if (sid === socketid) {
      if (track === "camera") isCam = false;
      if (track === "mic") isMic = false;
    }
  });
  socket.on("onAddTrack", ({ sid, track }) => {
    if (sid === socketid) {
      if (track === "camera") isCam = true;
      if (track === "mic") isMic = true;
    }
  });
  // $: console.log($usersInVC);
  $: if ($usersInVC[$selectedVC.id]) {
    $usersInVC[$selectedVC.id].forEach((us) => {
      if (us.sid === socketid) {
        userRemote = us.user;
      }
    });
  }
</script>

{#if !isMic}
  <div class="icon-button mic-off" aria-disabled="true">
    <MicOffIcon />
  </div>
{/if}

<div
  style="display: {isCam ? 'initial' : 'none'};width: 100%;
      height: 100%;"
>
  <video bind:this={video} autoplay playsinline>
    <track kind="captions" />
  </video>
</div>

<div
  style="background-image: url({userRemote
    ? userRemote.photoURL
    : ''});display: {isCam ? 'none' : 'initial'};"
  class="pfp"
/>

<style>
  .mic-off {
    position: absolute;
    background-color: hsl(0, 0%, 15%);
    top: 10px;
    right: 10px;
    min-width: 30px !important;
    min-height: 30px !important;
    width: 30px;
    height: 30px;
    padding: 7px !important;
  }
  .pfp {
    width: 100px;
    height: 100px;
    background-size: contain;
  }
</style>
