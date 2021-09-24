<script>
  export let type = "";
  import { DialogContent, DialogOverlay } from "svelte-accessible-dialog";
  import { PlusIcon, XIcon } from "svelte-feather-icons";
  import emoji from "../assets/emoji";
  import EmojiPicker from "./EmojiPicker.svelte";
  import clickOutside from "../utils/clickOutside";
  import { collection, doc, setDoc } from "@firebase/firestore";
  import { db } from "../utils/firebase";
  import { selectedRoom } from "../utils/store";

  let isOpen = false;
  let isEmoji = false;
  const open = () => {
    isOpen = true;
  };
  const close = () => {
    isOpen = false;
  };
  const toggleEmoji = () => {
    isEmoji = !isEmoji;
  };
  const closeEmoji = () => {
    isEmoji = false;
  };

  let typeIcon = emoji[0].icon;
  let name = "";

  const createChannel = async () => {
    const channelRef = doc(
      collection(db, "rooms", $selectedRoom.id, "channels")
    );
    try {
      await setDoc(channelRef, {
        id: channelRef.id,
        name,
        typeIcon,
        type: type.toLowerCase(),
        category: `${type.toLowerCase()} channels`,
      });
    } catch (e) {
      console.error(e);
    }
    close();
  };
</script>

<button
  class="icon-button-small btn-small btn-outline"
  title="Add {type} Channel"
  on:click={open}
>
  <PlusIcon />
</button>
<DialogOverlay {isOpen} onDismiss={close}>
  <DialogContent class="dialog">
    <button
      on:click={close}
      class="icon-button x-icon"
      style="align-self: flex-end;"
    >
      <XIcon />
    </button>
    <div class="content">
      <h2>Add {type} Channel</h2>
      <p class="size14 grey-text">
        Create a {type.toLowerCase()} channel with an icon and a name
      </p>
      <div class="bar">
        <div use:clickOutside on:click_outside={closeEmoji}>
          <button title="Channel Icon" class="emoji" on:click={toggleEmoji}
            >{typeIcon}</button
          >
          {#if isEmoji}
            <EmojiPicker bind:typeIcon />
          {/if}
        </div>
        <input
          style="width: 100%;margin-left:20px"
          type="text"
          bind:value={name}
          placeholder="Channel Name"
          title="Channel Name"
        />
      </div>

      <div class="btn-bar" style="margin-top: {isEmoji ? '230px' : '20px'};">
        <button on:click={close}>Cancel</button>
        <button
          disabled={name.trim() === "" && typeIcon.trim() === ""}
          on:click={createChannel}>Add</button
        >
      </div>
    </div>
  </DialogContent>
</DialogOverlay>

<style>
  .content {
    text-align: center;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 400px;
    margin-top: 10px;
  }
  .content > * {
    margin: 5px 0;
  }
  .bar {
    display: flex;
    align-items: center;
  }
  .emoji {
    position: relative;
  }
</style>
