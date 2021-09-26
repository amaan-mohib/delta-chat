<script>
  import { onDestroy, onMount } from "svelte";
  import Video from "../components/Video.svelte";
  import { socketVC as socket } from "../utils/socket";
  import { isInVC, selectedVC, status, user, usersInVC } from "../utils/store";
  import Peer from "simple-peer/simplepeer.min.js";
  import VideoRemote from "../components/VideoRemote.svelte";
  import {
    ArrowLeftIcon,
    CameraIcon,
    CameraOffIcon,
    MicIcon,
    MicOffIcon,
    PhoneOffIcon,
  } from "svelte-feather-icons";
  import Loader from "../components/Loader.svelte";

  let streamProp;
  let peerRef = [];
  let streamState;
  let loading = false;
  let isMic = true;
  let isCam = true;

  let audioContext = null;
  let volumeCallback = null;
  let volumeInterval = null;
  let volumes = [];
  let volume = 0;

  const createPeer = (userToSignal, callerID, stream, userR) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal, userR });
    });
    return peer;
  };
  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };
  const muteMic = () => {
    if (streamState) {
      isMic = !isMic;
      if (isMic) {
        socket.emit("addTrack", {
          channelID: $selectedVC.id,
          sid: socket.id,
          track: "mic",
        });
      } else {
        socket.emit("removeTrack", {
          channelID: $selectedVC.id,
          sid: socket.id,
          track: "mic",
        });
      }
      streamState.getAudioTracks()[0].enabled = isMic;
    }
  };
  const muteCam = () => {
    if (streamState) {
      isCam = !isCam;
      streamState.getVideoTracks()[0].enabled = isCam;
      if (isCam) {
        socket.emit("addTrack", {
          channelID: $selectedVC.id,
          sid: socket.id,
          track: "camera",
        });
      } else {
        socket.emit("removeTrack", {
          channelID: $selectedVC.id,
          sid: socket.id,
          track: "camera",
        });
      }
    }
  };

  $: if (volumeCallback !== null && volumeInterval === null)
    volumeInterval = setInterval(volumeCallback, 100);
  $status = "Connecting...";
  onMount(() => {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    $status = "Preparing devices";
    if ($selectedVC) {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: { echoCancellation: true },
        })
        .then((stream) => {
          if (socket.disconnected) {
            socket.connect();
          }
          streamProp = stream;
          streamState = stream;

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

          socket.emit("joinVC", { channelID: $selectedVC.id, user: $user });

          $status = "Connected";
          socket.on("allUsersInVC", (allUsers) => {
            if (allUsers.length > 0) {
              // console.log(allUsers);
              allUsers.forEach(({ sid, user: userR }) => {
                // console.log(sid, userR);
                const peersL = [];
                const peer = createPeer(sid, socket.id, stream, userR);
                peersL.push({
                  peerID: sid,
                  peer,
                });
                peerRef = peersL;
              });
            }
          });
          socket.on("user joined", (payload) => {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            // console.log(payload);
            peerRef.push({
              peerID: payload.callerID,
              peer,
            });
            peerRef = peerRef;
            if (!isCam) {
              socket.emit("removeTrack", {
                channelID: $selectedVC.id,
                sid: socket.id,
                track: "camera",
              });
            }
            if (!isMic) {
              socket.emit("removeTrack", {
                channelID: $selectedVC.id,
                sid: socket.id,
                track: "mic",
              });
            }
          });

          socket.on("receiving returned signal", (payload) => {
            const item = peerRef.find((p) => p.peerID === payload.id);
            item.peer.signal(payload.signal);
          });

          socket.on("user left", (sid) => {
            const peerObj = peerRef.find((p) => p.peerID === sid);
            if (peerObj) {
              peerObj.peer.removeAllListeners();
              peerObj.peer.destroy();
            }
            const peersL = peerRef.filter((p) => p.peerID !== sid);
            peerRef = peersL;
          });
        })
        .catch((e) => {
          console.error(e);
          loading = true;
        });
    }
  });
  onDestroy(() => {
    if (streamState) {
      if (volumeInterval !== null) {
        clearInterval(volumeInterval);
        volumeInterval = null;
      }
      $status = "Leaving...";
      streamState.getTracks().forEach((t) => t.stop());
      peerRef = [];
      socket.off();
      socket.disconnect();
      $status = "";
    }
  });
</script>

<div class="vc">
  <div class="videos">
    <div class="video" style="box-shadow: 0 0 0 {volume * 5}px;">
      {#if !isMic}
        <div class="icon-button mic-off" aria-disabled="true">
          <MicOffIcon />
        </div>
      {/if}
      <div class="name" aria-disabled="true">
        {$user.displayName}
      </div>
      {#if !streamProp}
        <Loader />
      {:else if loading}
        <p>Looks like you don't have access to your media devices</p>
      {/if}
      <div
        style="display: {isCam && streamProp ? 'initial' : 'none'};width: 100%;
      height: 100%;"
      >
        <Video stream={streamProp} />
      </div>

      <div
        style="background-image: url({$user.photoURL});display: {isCam
          ? 'none'
          : 'initial'};"
        class="pfp"
      />
    </div>
    {#each peerRef as ref (ref.peerID)}
      <VideoRemote peer={ref.peer} socketid={ref.peerID} />
    {/each}
  </div>
  <div class="controls">
    <button
      class="icon-button"
      title="Hide"
      style="align-self: flex-start;"
      on:click={() => {
        $isInVC = false;
      }}
    >
      <ArrowLeftIcon />
    </button>
    <button
      class="icon-button {isMic ? '' : 'inactive'}"
      on:click={muteMic}
      title={isMic ? "Mute" : "Unmute"}
    >
      {#if isMic}
        <MicIcon />
      {:else}
        <MicOffIcon />
      {/if}
    </button>
    <button
      class="icon-button {isCam ? '' : 'inactive'}"
      on:click={muteCam}
      title={isCam ? "Off" : "On"}
    >
      {#if isCam}
        <CameraIcon />
      {:else}
        <CameraOffIcon />
      {/if}
    </button>
    <button
      class="icon-button end-call"
      title="Hang Up"
      on:click={() => {
        $selectedVC = null;
        $isInVC = false;
      }}
    >
      <PhoneOffIcon />
    </button>
  </div>
</div>

<style>
  .vc {
    position: fixed;
    background-color: black;
    width: calc(100% - 72px - 240px);
    top: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 99;
    overflow-y: auto;
  }
  .videos {
    display: grid;
    padding: 10px;
    gap: 15px;
    width: 100%;
    align-items: center;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    grid-auto-rows: auto;
    max-height: calc(100vh - 60px);
    margin-bottom: 60px;
  }
  .controls {
    position: absolute;
    bottom: 0;
    height: 60px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background: rgba(34, 34, 34, 0.473);
    backdrop-filter: blur(10px);
  }
  .controls > * {
    margin: 0 10px;
  }
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
  :global(video) {
    width: 100%;
    max-height: 100%;
  }
  .inactive {
    background-color: white;
    color: black;
  }
  .end-call {
    background: hsl(359, 83%, 55%);
  }
  .end-call:hover {
    background: hsl(359, 83%, 45%);
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
  .name {
    position: absolute;
    background-color: hsla(0, 0%, 15%, 0.7);
    bottom: 10px;
    left: 10px;
    padding: 7px !important;
    border-radius: 5px;
    font-size: 12px;
  }
  .pfp {
    width: 100px;
    height: 100px;
    background-size: contain;
  }
  @media only screen and (max-width: 865px) {
    .vc {
      width: 100vw;
      visibility: visible;
      left: 0;
    }
  }
</style>
