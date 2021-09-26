<script>
  import { getAuth, updateProfile } from "@firebase/auth";

  import { doc, serverTimestamp, updateDoc } from "@firebase/firestore";

  import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";

  export let Close;
  export let isOpen;

  import { DialogContent, DialogOverlay } from "svelte-accessible-dialog";
  import { PlusSquareIcon, XIcon } from "svelte-feather-icons";
  import finalCompressedBlob from "../utils/compressImage";
  import { db, storageRef } from "../utils/firebase";
  import { user } from "../utils/store";

  let name = $user.displayName;
  let pfp = $user.photoURL;
  let preview;
  let pfpTemp = null;
  let remove = false;

  const uploadImage = (id) => {
    return new Promise((resolve, reject) => {
      if (pfpTemp) {
        const typeArr = pfpTemp.type.split("/");
        const type = pfpTemp.type.split("/")[typeArr.length - 1];
        const uploadTask = uploadBytesResumable(
          ref(storageRef, "pfps/" + `${id}.${type}`),
          pfpTemp
        );
        uploadTask.on(
          "state_changed",
          (ss) => {
            const progress = (ss.bytesTransferred / ss.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              console.log(url);
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

  const changeProfile = async () => {
    await uploadImage($user.uid);
    const auth = getAuth();
    updateProfile(auth.currentUser, {
      displayName: name,
      photoURL: pfp,
    })
      .then(async () => {
        const userRef = doc(db, "users", $user.uid);
        try {
          await updateDoc(userRef, {
            displayName: name,
            photoURL: pfp,
            modifiedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error(error);
        }
        $user.displayName = name;
        $user.photoURL = pfp;
        $user.modifiedAt = new Date().toLocaleDateString("en-IN");
        Close();
      })
      .catch((e) => console.error(e));
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

<DialogOverlay {isOpen} onDismiss={Close}>
  <DialogContent aria-label="Edit Profile" class="dialog">
    <button
      on:click={Close}
      class="icon-button x-icon"
      style="align-self: flex-end;"
    >
      <XIcon />
    </button>
    <div class="content">
      <h2>Edit Profile</h2>
      <div class="upload-parent">
        <img bind:this={preview} src={pfp} alt="Profile" class="roomImg" />
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
            pfp = `https://avatars.dicebear.com/api/identicon/${name
              .split(" ")
              .join("")}.svg`;
            preview.src = pfp;
          } else {
            remove = false;
            pfp = $user.photoURL;
            preview.src = pfp;
          }
        }}>{!remove ? "Remove" : "Reset"}</span
      >
      <input type="text" placeholder="Name" bind:value={name} title="Name" />
      <i class="grey-text size12" style="text-align: left;"
        >Last Modified: {($user.modifiedAt &&
          $user.modifiedAt.toDate().toLocaleDateString("en-IN")) ||
        typeof $user.createdAt === "string"
          ? $user.createdAt
          : $user.createdAt.toDate().toLocaleDateString("en-IN")}</i
      >
      <div class="btn-bar">
        <button on:click={Close}>Cancel</button>
        <button disabled={name.trim() === ""} on:click={changeProfile}
          >Confirm</button
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
