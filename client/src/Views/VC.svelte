<script>
  import { onMount } from "svelte";
  import Video from "../components/Video.svelte";
  import socket from "../utils/socket";
  import { selectedVC, user } from "../utils/store";
  import Peer from "simple-peer/simplepeer.min.js";
  import VideoRemote from "../components/VideoRemote.svelte";

  let streamProp;
  let peers = [];
  let peerRef = [];

  const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal });
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
  onMount(() => {
    console.log("rendered again");
    if ($selectedVC) {
      navigator.mediaDevices
        .getUserMedia({ video: videoConstraints, audio: true })
        .then((stream) => {
          streamProp = stream;
          socket.emit("joinVC", { channelID: $selectedVC.id, user: $user });
          socket.on("allUsersInVC", (allUsers) => {
            if (allUsers.length > 0) {
              allUsers.forEach(({ sid }) => {
                const peersL = [];
                const peer = createPeer(sid, socket.id, stream);
                peerRef.push({
                  peerID: sid,
                  peer,
                });
                peersL.push(peer);
                peers = peersL;
              });
            }
          });
          socket.on("user joined", (payload) => {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peerRef.push({
              peerID: payload.callerID,
              peer,
            });
            peers.push(peer);
            peers = peers;
          });
        });
      socket.on("receiving returned signal", (payload) => {
        const item = peerRef.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });
      console.log(peers);
    }
  });
</script>

<div>
  <Video stream={streamProp} />
  {peers.length}
  {#each peers as peer}
    <VideoRemote {peer} />
  {/each}
</div>
