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

  let audioContext = null;
  let volumeCallback = null;
  let volumeInterval = null;
  let volumes = [];
  let volume = 0;

  $: if (volumeCallback !== null && volumeInterval === null)
    volumeInterval = setInterval(volumeCallback, 100);

  $: peer &&
    peer.on("stream", (stream) => {
      video.srcObject = stream;
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      audioSource.connect(analyser);
      volumes = new Uint8Array(analyser.frequencyBinCount);
      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;
        for (const volume of volumes) volumeSum += volume;
        const averageVolume = volumeSum / volumes.length;
        // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
        volume = averageVolume / 127;
      };
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

  $: if ($usersInVC[$selectedVC.id]) {
    $usersInVC[$selectedVC.id].forEach((us) => {
      if (us.sid === socketid) {
        userRemote = us.user;
      }
    });
  }
</script>

<div class="video" style="box-shadow: 0 0 0 {volume * 5}px;">
  {#if !isMic}
    <div class="icon-button mic-off" aria-disabled="true">
      <MicOffIcon />
    </div>
  {/if}
  <div class="name" aria-disabled="true">
    {userRemote.displayName || "Loading"}
  </div>
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
</div>

<style>
  .video {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    aspect-ratio: 16/9;
    border-radius: 5px;
    overflow: hidden;
    background-color: hsl(0, 0%, 15%);
    transition: box-shadow 100ms linear;
  }
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
  .name {
    position: absolute;
    background-color: hsla(0, 0%, 15%, 0.7);
    bottom: 10px;
    left: 10px;
    padding: 7px !important;
    border-radius: 5px;
    font-size: 12px;
  }
</style>
