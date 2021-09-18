<script>
  import { isInVC, selectedVC, user } from "../utils/store";
  import { PhoneOffIcon, SettingsIcon } from "svelte-feather-icons";
  import { useNavigate, useLocation } from "svelte-navigator";
  import VC from "../Views/VC.svelte";

  const navigate = useNavigate();
  const location = useLocation();

  const settings = () => {
    const from = ($location.state && $location.state.from) || "/settings";
    navigate(from);
  };
</script>

<div class="profile-bar">
  {#if $selectedVC}
    <div class={$selectedVC && $isInVC ? "showVC" : "hideVC"}>
      <VC />
    </div>
    <div>
      <p>{$selectedVC.name} / {$selectedVC.room.name}</p>
      <button
        class="icon-button"
        on:click={() => {
          $selectedVC = null;
          $isInVC = false;
        }}
      >
        <PhoneOffIcon />
      </button>
    </div>
  {/if}
  <div>
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
</div>

<style>
  .profile-bar {
    justify-self: end;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    padding: 10px;
    background-color: hsl(0, 0%, 15%);
  }
  .profile-bar div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pfp {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    margin-right: 8px;
  }
  .hideVC {
    display: none !important;
  }
  .showVC {
    display: block !important;
  }
</style>
