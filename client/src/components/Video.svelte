<script>
  export let stream;
  let video;

  $: if (stream && video.srcObject !== stream) {
    video.srcObject = stream;
  }
</script>

<video bind:this={video} autoplay playsinline muted>
  <track kind="captions" />
</video>
