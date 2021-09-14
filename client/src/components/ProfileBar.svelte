<script>
  import { user } from "../utils/store";
  import { SettingsIcon } from "svelte-feather-icons";
  import { useNavigate, useLocation } from "svelte-navigator";

  const navigate = useNavigate();
  const location = useLocation();

  const settings = () => {
    const from = ($location.state && $location.state.from) || "/settings";
    navigate(from);
  };
</script>

<div class="profile-bar">
  <div>
    <img class="pfp" src={$user.photoURL} alt={$user.displayName} />
    <span class="size14 medium-text">{$user.displayName}</span>
  </div>
  <div>
    <button class="icon-button" title="Settings" on:click={settings}>
      <SettingsIcon />
    </button>
  </div>
</div>

<style>
  .profile-bar {
    justify-self: end;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px;
    background-color: hsl(0, 0%, 15%);
  }
  .profile-bar > div {
    display: flex;
    align-items: center;
  }
  .pfp {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    margin-right: 8px;
  }
</style>
