<script>
  import { ghLogin, login } from "../utils/firebase";
  import google from "../assets/images/google.svg";
  import delta from "../assets/images/delta.svg";
  import { GithubIcon } from "svelte-feather-icons";
</script>

<div class="login">
  <div class="block">
    <h1 style="display: flex; align-items:center">
      <img src={delta} alt="delta" class="delta" />Chat
    </h1>
    <p class="grey-text size14">Sign in to continue</p>
  </div>
  <div class="block">
    <button on:click={login}>
      <div class="icon" style="background-image: url({google});" />
      Sign in with Google</button
    >
    <button on:click={ghLogin}>
      <div class="icon">
        <GithubIcon />
      </div>
      Sign in with GitHub</button
    >
  </div>
</div>

<style>
  .login {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }
  .block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .block > * {
    margin: 5px 0;
  }
  .icon {
    background-size: cover;
    width: 20px;
    height: 20px;
    margin-right: 10px;
    margin-left: -4px;
  }
  .delta {
    width: 0.85em;
    margin-right: 5px;
  }
</style>
