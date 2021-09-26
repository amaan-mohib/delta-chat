<script>
  import { doc, updateDoc } from "@firebase/firestore";
  import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
  import { DialogContent, DialogOverlay } from "svelte-accessible-dialog";
  import {
    CheckIcon,
    CopyIcon,
    LoaderIcon,
    MoreHorizontalIcon,
    PlusSquareIcon,
    SettingsIcon,
    XIcon,
  } from "svelte-feather-icons";
  import clickOutside from "../utils/clickOutside";
  import finalCompressedBlob from "../utils/compressImage";
  import { db, storageRef } from "../utils/firebase";
  import { appName, menu, selectedRoom } from "../utils/store";

  let name = $selectedRoom.name;
  let pfp = $selectedRoom.img;
  let pfpTemp = null;
  let remove = false;
  let preview;
  let isOpen = false;
  let loading = false;
  const open = () => {
    isOpen = true;
    $menu = false;
  };
  const close = () => {
    isOpen = false;
  };
  let isPopUp = false;
  const togglePop = () => {
    isPopUp = !isPopUp;
  };
  const closePop = () => {
    isPopUp = false;
  };
  let copied = false;
  const copy = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          copied = true;
          setTimeout(() => {
            copied = false;
          }, 1000);
        })
        .catch((err) => console.error(err));
    }
  };
  const uploadImage = (id) => {
    return new Promise((resolve, reject) => {
      if (pfpTemp) {
        const typeArr = pfpTemp.type.split("/");
        const type = pfpTemp.type.split("/")[typeArr.length - 1];
        const uploadTask = uploadBytesResumable(
          ref(storageRef, "rooms/" + `${id}.${type}`),
          pfpTemp
        );
        uploadTask.on(
          "state_changed",
          (ss) => {
            const progress = (ss.bytesTransferred / ss.totalBytes) * 100;
            // console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              // console.log(url);
              pfp = url;
              resolve();
            });
          }
        );
      } else {
        resolve();
      }
    });
  };
  const editRoom = async () => {
    loading = true;
    await uploadImage($selectedRoom.id);
    const docRef = doc(db, "rooms", $selectedRoom.id);
    try {
      await updateDoc(docRef, {
        name,
        img: pfp,
      });
    } catch (e) {
      console.error(e);
    }
    loading = false;
    close();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    preview.src = URL.createObjectURL(file);
    const compressedBlob = await finalCompressedBlob(file, preview);
    pfpTemp = compressedBlob;
    preview.src = URL.createObjectURL(compressedBlob);
    URL.revokeObjectURL(preview);
    remove = false;
  };
</script>

<div use:clickOutside on:click_outside={closePop} class="relative">
  <button
    class="icon-button-small btn-small btn-outline"
    title="Room Settings"
    on:click={togglePop}
  >
    <MoreHorizontalIcon />
  </button>
  {#if isPopUp}
    <div class="popup">
      <div
        class="popup-item"
        on:click={() => {
          copy(`${appName}/invite/${$selectedRoom.id}`);
        }}
      >
        <div class="icon">
          {#if copied}
            <CheckIcon />
          {:else}
            <CopyIcon />
          {/if}
        </div>
        <span class="text">{copied ? "Copied" : "Copy Invite URL"}</span>
      </div>
      <div
        class="popup-item"
        on:click={() => {
          open();
          closePop();
        }}
      >
        <div class="icon"><SettingsIcon class="icon" /></div>
        <span class="text">Room Settings</span>
      </div>
    </div>
  {/if}
</div>
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
      <h2>Edit Room</h2>
      <div class="upload-parent">
        <img bind:this={preview} src={pfp} alt="Room Icon" class="roomImg" />
        <div class="add-badge">
          <PlusSquareIcon />
        </div>
        <input
          class="input-image"
          type="file"
          accept="image/*"
          name="roomImg"
          on:change={handleUpload}
        />
      </div>
      <span
        class="option grey-text"
        on:click={() => {
          pfpTemp = null;
          if (!remove) {
            remove = true;
            pfp = `https://avatars.dicebear.com/api/jdenticon/${name
              .split(" ")
              .join("")}.svg`;
            preview.src = pfp;
          } else {
            remove = false;
            pfp = $selectedRoom.img;
            preview.src = pfp;
          }
        }}>{!remove ? "Remove" : "Reset"}</span
      >
      <input
        type="text"
        bind:value={name}
        placeholder="Room Name"
        title="Room Name"
      />

      <div class="btn-bar">
        <button on:click={close}>Cancel</button>
        <button disabled={name.trim() === ""} on:click={editRoom}>
          {#if loading}
            <div class="loading"><LoaderIcon /></div>
          {:else}
            Confirm
          {/if}
        </button>
      </div>
    </div>
  </DialogContent>
</DialogOverlay>

<style>
  .relative {
    position: relative;
  }
  .popup {
    position: absolute;
    background-color: hsl(0, 0%, 20%);
    padding: 5px;
    border-radius: 5px;
    margin: 8px 0;
    box-shadow: 0 0px 5px 2px rgb(0 0 0 / 50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .popup-item {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-radius: 5px;
    width: 100%;
  }
  .icon {
    width: 24px;
    height: 24px;
    margin-right: 10px;
  }
  .text {
    width: max-content;
  }
  .popup-item:hover {
    cursor: pointer;
    background-color: hsl(0, 0%, 15%);
  }
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
  .upload-parent {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 10px auto;
  }
  .input-image {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .add-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 26px;
    height: 26px;
    padding: 3px;
    border-radius: 50%;
    background-color: hsl(0, 0%, 15%);
    box-shadow: 0 0 0 3px hsl(0deg 0% 20%);
  }
  .roomImg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .option {
    font-size: 12px;
    text-align: center;
  }
  .option:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
