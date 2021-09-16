<script>
  export let peer;
  let video;

  $: peer.on("stream", (stream) => {
    video.srcObject = stream;
  });
</script>

<video bind:this={video} autoplay playsinline>
  <track kind="captions" />
</video>
