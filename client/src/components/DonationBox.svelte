<script>
  export let Close;
  export let isOpen;

  import { DialogContent, DialogOverlay } from "svelte-accessible-dialog";
  import { XIcon } from "svelte-feather-icons";
  import { analytics } from "../utils/firebase";
  import { logEvent } from "@firebase/analytics";
</script>

<DialogOverlay {isOpen} onDismiss={Close}>
  <DialogContent aria-label="Enjoying your time here?" class="dialog">
    <button
      on:click={Close}
      class="icon-button x-icon"
      style="align-self: flex-end;"
    >
      <XIcon />
    </button>
    <div class="content">
      <h2>Enjoying your time here?</h2>
      <p>Help us keep the conversations going!</p>
      <p style="font-size: 14px;">
        Running a community platform isn't free. Servers, storage, and
        maintenance all add up. If you enjoy being here, consider supporting us
        with a coffee.
      </p>
      <p style="font-size: 14px;">
        It helps keep the platform running and growing.
      </p>
      <div class="action-box">
        <a
          href="https://buymeacoffee.com/amaan.mohib"
          target="_blank"
          class="donate-link donate-btn button"
          on:click={() => {
            logEvent(analytics, "donation-clicked-dialog");
          }}
        >
          ❤️ Buy us a coffee
        </a>
      </div>
      <p style="font-size: 14px;font-style: italic;">
        No pressure. We're just happy to have you here!
      </p>
    </div>
  </DialogContent>
</DialogOverlay>

<style>
  .content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 400px;
    margin-top: 10px;
  }
  .content > * {
    margin: 5px 0;
  }
  .donate-link {
    text-decoration: none;
    width: fit-content;
  }
  .action-box {
    margin: 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>
