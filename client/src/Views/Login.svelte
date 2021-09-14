<script>
  import { login } from "../utils/firebase";
</script>

<div class="login">
  <h1>Login</h1>
  <button on:click={login}>Sign in with Google</button>
</div>

<style>
  .login {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
