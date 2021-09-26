<script>
  import { isInVC, menu, selectedVC, status, user } from "../utils/store";
  import { PhoneOffIcon, SettingsIcon } from "svelte-feather-icons";
  import VC from "../Views/VC.svelte";
  import { DialogContent, DialogOverlay } from "svelte-accessible-dialog";
  import Settings from "../Views/Settings.svelte";

  let isOpen = false;
  const open = () => {
    isOpen = true;
    $menu = false;
  };
  const close = () => {
    isOpen = false;
  };
  const copy = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText($user.uid)
        .catch((err) => console.error(err));
    }
  };
</script>

<div class="profile-bar">
  {#if $selectedVC}
    <div class={$selectedVC && $isInVC ? "showVC" : "hideVC"}>
      <VC />
    </div>
    <div
      class="vc-bar"
      on:click={() => {
        $isInVC = true;
      }}
    >
      <div style="display: flex;flex-direction:column;align-items:flex-start">
        <p class="size14" style="color: #4fdc7c;font-weight:600">
          {$status}
        </p>
        <p class="location size12">
          {$selectedVC.name} / {$selectedVC.room.name}
        </p>
      </div>
      <button
        title="Hang Up"
        class="icon-button"
        on:click={() => {
          $selectedVC = null;
          $isInVC = false;
        }}
      >
        <PhoneOffIcon />
      </button>
    </div>
    <hr />
  {/if}
  <div>
    <div title="Click to copy ID" on:click={copy} class="hover">
      <img class="pfp" src={$user.photoURL} alt={$user.displayName} />
      <span class="size14 medium-text">{$user.displayName}</span>
    </div>
    <div>
      <button class="icon-button" title="Settings" on:click={open}>
        <SettingsIcon />
      </button>
      <DialogOverlay {isOpen} onDismiss={close}>
        <DialogContent class="dialog full-dialog">
          <Settings Close={close} />
        </DialogContent>
      </DialogOverlay>
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
    background-color: hsl(0, 0%, 10%);
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
  hr {
    border: none;
    height: 1px;
    background-color: rgb(236, 236, 236);
    margin: 5px 0;
  }
  .vc-bar:hover,
  .hover:hover {
    cursor: pointer;
  }
  .location:hover {
    text-decoration: underline;
  }
</style>
