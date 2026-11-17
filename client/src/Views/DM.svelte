<script>
  import { onDestroy, onMount } from "svelte";

  import { db } from "../utils/firebase";
  import socket from "../utils/socket";
  import { user, selectedDM } from "../utils/store";
  import {
    collection,
    setDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    arrayUnion,
  } from "firebase/firestore";

  let messages = [];
  let message = "";
  let sendMessageTimeout;

  $: $selectedDM, getMessages();

  async function getMessages() {
    try {
      if ($selectedDM.id) {
        const q = query(
          collection(db, `dms/${$selectedDM.id}/messages`),
          orderBy("sentAt", "desc"),
        );
        const snap = await getDocs(q);
        messages = snap.docs.map((doc) => doc.data());
      }
    } catch (e) {
      console.error(e);
    }
  }

  onMount(() => {
    socket.on("message", (data) => {
      // console.log(data);
      messages = [data, ...messages];
    });
  });
  const sendMessage = () => {
    const text = message;
    if (text.trim() === "" || sendMessageTimeout !== undefined) return;

    const roomId = $selectedDM.id;
    const currentUser = $user;

    sendMessageTimeout = setTimeout(() => {
      sendMessageTimeout = undefined;
    }, 300);
    sendMessageNow(text, roomId, currentUser);
  };

  const sendMessageNow = async (text, roomId, currentUser) => {
    if (text.trim() === "") return;

    const pair = roomId.split("_");
    const puid = pair.filter((id) => id !== currentUser.uid)[0];
    if (!currentUser.dms.includes(puid)) {
      await updateDoc(doc(db, "users", currentUser.uid), {
        dms: arrayUnion(puid),
      });
    }

    socket.emit(
      "sendMessage",
      {
        user: currentUser,
        text,
        room: roomId,
        channel: roomId,
        sentAt: new Date().toLocaleDateString("en-IN"),
      },
      async () => {
        if (message === text) message = "";

        //storing in db
        try {
          const msgRef = doc(collection(db, `dms/${roomId}/messages`));
          await setDoc(msgRef, {
            sender: currentUser,
            text: text,
            room: roomId,
            channel: roomId,
            id: msgRef.id,
            sentAt: serverTimestamp(),
          });
        } catch (e) {
          console.error(e);
        }
      },
    );
  };

  onDestroy(() => clearTimeout(sendMessageTimeout));

  const onKeyDown = (e) => {
    const { key } = e;
    if (key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };
</script>

<div class="chat">
  {#if $selectedDM}
    <header>
      <span>
        @
        {$selectedDM.name}
      </span>
    </header>
    <div class="chat-main">
      <div class="messages">
        {#each messages as msg}
          {#if msg.room === $selectedDM.id && msg.channel === $selectedDM.id && msg.text !== ""}
            <div
              class="message {msg.sender.uid === $user.uid
                ? 'right-align'
                : ''} {msg.sender.displayName === 'admin' ? 'admin' : ''}"
            >
              {#if msg.sender.uid !== $user.uid}
                <img
                  class="pfp"
                  src={msg.sender.photoURL}
                  alt={msg.sender.displayName}
                />
              {/if}
              <div>
                {#if msg.sender.uid !== $user.uid}
                  <p class="sender-name">{msg.sender.displayName}</p>
                {/if}
                <p class="message-text">{msg.text}</p>
                <p class="message-sentat">
                  {typeof msg.sentAt === "string"
                    ? msg.sentAt
                    : msg.sentAt.toDate().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          {/if}
        {/each}
      </div>
      <div class="send">
        <input
          autofocus
          type="text"
          bind:value={message}
          on:keydown={onKeyDown}
          placeholder="Type something..."
        />
        <button on:click={sendMessage} disabled={message.trim() === ""}
          >Send</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-main {
    display: flex;
    flex-direction: column;
    padding: 10px;
    width: 100%;
    flex: 1;
  }
  .messages {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
  }
  .send {
    margin: 10px 0;
    width: 100%;
    display: flex;
    align-items: center;
  }
  .send > input {
    width: 100%;
    margin-right: 10px;
  }
  .message {
    display: flex;
    align-items: center;
    justify-content: start;
    margin-top: 10px;
    max-width: 80%;
  }
  .message-text {
    padding: 3px 10px;
    background-color: hsl(0, 0%, 15%);
    border: 1px solid hsl(0, 0%, 15%);
    border-radius: 10px;
    border-bottom-left-radius: 5px;
    margin: 2px 0;
  }
  .right-align {
    align-self: flex-end;
  }
  .right-align .message-text {
    background-color: hsl(0, 0%, 20%);
    border-radius: 10px;
    border-bottom-right-radius: 5px;
  }
  .right-align .message-sentat {
    text-align: right;
  }
  .pfp {
    margin-right: 8px;
  }
  .message-sentat {
    font-size: 10px;
    color: hsl(0, 0%, 70%);
  }
  .sender-name {
    font-size: 12px;
    color: hsl(0, 0%, 70%);
  }
  .admin {
    align-self: center;
    text-align: center;
  }
  .admin .message-text {
    border-radius: 10px !important;
  }
  .admin .pfp,
  .admin .sender-name {
    display: none;
  }
</style>
