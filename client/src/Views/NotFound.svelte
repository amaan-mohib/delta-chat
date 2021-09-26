<script>
  import { app } from "../utils/store";
</script>

<svelte:head>
  <title>
    {`404 - ${app}`}
  </title>
</svelte:head>
<div class="main">
  <h1>404</h1>
  <p>Not Found.</p>
</div>

<style>
  .main {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }
</style>
