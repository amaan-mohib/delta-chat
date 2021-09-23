<script>
  import Channel from "../../components/Channel.svelte";
  import {
    dmList,
    isInVC,
    selectedChannel,
    selectedDM,
    selectedRoom,
    selectedVC,
    user,
    usersInVC,
  } from "../../utils/store";
  import { collection, query, onSnapshot, where } from "firebase/firestore";
  import { db } from "../../utils/firebase";
  import { onDestroy, onMount } from "svelte";
  import { useParams } from "svelte-navigator";
  import ProfileBar from "../../components/ProfileBar.svelte";
  import socket from "../../utils/socket";
  import DmChannel from "../../components/DMChannel.svelte";
  import { PlusIcon } from "svelte-feather-icons";

  // const channels = [
  //   {
  //     name: "first",
  //     type: "✏️",
  //   },
  // ];

  let unsub;
  let dmSub;
  let channels = [];
  let vcs = [];
  let dms = [];
  const params = useParams();

  $: channelID = $params.channel;

  $: $selectedRoom, changeChannel();

  function changeChannel() {
    if ($user && $selectedRoom.id) {
      // console.log($selectedRoom);
      if ($selectedRoom.id === "me") {
        channels = [
          {
            id: "friends",
            name: "Friends",
            typeIcon: "👥",
          },
        ];
        $selectedChannel = channels[0];
        window.history.replaceState({}, `Friends`, `/me/friends`);

        const q = query(
          collection(db, "users"),
          where("dms", "array-contains", $user.uid)
        );
        dmSub = onSnapshot(q, (querySnapshot) => {
          let allDms = querySnapshot.docs.map((doc) => {
            return {
              name: doc.data().displayName,
              id: [doc.data().uid, $user.uid].sort().join("_"),
              pfp: doc.data().photoURL,
            };
          });
          console.log(allDms);
          dms = allDms;
          $dmList = allDms;
        });
      } else {
        const q = query(collection(db, `rooms/${$selectedRoom.id}/channels`));
        unsub = onSnapshot(q, (querySnapshot) => {
          let allChannels = querySnapshot.docs.map((doc) => doc.data());
          channels = allChannels.filter((room) => room.type === "text");
          vcs = allChannels.filter((channel) => !channels.includes(channel));
          // console.log(channels, vcs);
          if (channelID === "friends") {
            if (channels.length > 0) $selectedChannel = channels[0];
          } else {
            let filteredRoom = channels.filter((room) => room.id === channelID);
            $selectedChannel =
              filteredRoom.length > 0 ? filteredRoom[0] : channels[0];
          }
          // console.log(channels, $selectedChannel);
          if (channels.length > 0) {
            window.history.replaceState(
              {},
              `${$selectedChannel.name}`,
              `/${$selectedRoom.id}/${$selectedChannel.id}`
            );
          }
        });
      }
    }
  }

  onMount(() => {
    socket.on("usersVC", (data) => {
      $usersInVC = data;
    });
  });

  onDestroy(() => {
    unsub && unsub();
    dmSub && dmSub();
    $selectedChannel = {
      id: "friends",
      name: "Friends",
      typeIcon: "👥",
    };
  });

  const changeURLChannel = (channel) => {
    $selectedChannel = channel;
    window.history.replaceState(
      {},
      `${$selectedChannel.name}`,
      `/${$selectedRoom.id}/${$selectedChannel.id}`
    );
  };
</script>

<div class="channels-bar">
  <h4>{$selectedRoom.name}</h4>
  <hr />
  <div class="channels">
    {#if $selectedRoom.id !== "me"}
      <div
        style="display: flex;align-items:center;justify-content:space-between"
      >
        <p class="category">Text Channels</p>
        <button
          class="icon-button-small btn-small btn-outline"
          title="Add Channel"
        >
          <PlusIcon />
        </button>
      </div>
    {/if}
    {#each channels as channel (channel.id)}
      <Channel
        id={channel.id}
        name={channel.name}
        type={channel.typeIcon}
        on:click={() => {
          $selectedDM = null;
          $isInVC = false;
          changeURLChannel(channel);
        }}
      />
    {/each}
    <div style="margin-bottom: 10px;" />
    {#if vcs.length > 0 && $selectedRoom.id !== "me"}
      <div
        style="display: flex;align-items:center;justify-content:space-between"
      >
        <p class="category">Voice Channels</p>
        <button
          class="icon-button-small btn-small btn-outline"
          title="Add Channel"
        >
          <PlusIcon />
        </button>
      </div>
      {#each vcs as channel (channel.id)}
        <Channel
          id={channel.id}
          name={channel.name}
          type={channel.typeIcon}
          on:click={() => {
            $selectedDM = null;
            if (
              $usersInVC[channel.id] &&
              $usersInVC[channel.id].some((u) => u.user.uid === $user.uid)
            ) {
              console.log("in another client");
            } else {
              let temp = $selectedVC;
              if (temp && temp.id !== channel.id) {
                $selectedVC = null;
                setTimeout(() => {
                  $isInVC = true;
                  $selectedVC = { ...channel, room: $selectedRoom };
                }, 500);
              } else {
                $isInVC = true;
                $selectedVC = { ...channel, room: $selectedRoom };
              }
            }
          }}
        />
      {/each}
    {/if}
    <div style="margin-bottom: 10px;" />
    {#if dms.length > 0 && $selectedRoom.id === "me"}
      <p class="category">Direct Messages</p>
      {#each dms as channel (channel.id)}
        <DmChannel
          id={channel.id}
          name={channel.name}
          pfp={channel.pfp}
          on:click={() => {
            $selectedChannel = {};
            $selectedDM = channel;
            socket.emit("joinDM", { room: channel.id }, (error) => {
              if (error) console.error(error);
            });
          }}
        />
      {/each}
    {/if}
  </div>
  <ProfileBar />
</div>

<style>
  h4 {
    text-transform: uppercase;
    text-overflow: ellipsis;
    overflow-x: hidden;
    overflow-y: clip;
    padding: 10px;
    width: 240px;
    height: 40px;
  }
  hr {
    border: none;
    height: 1px;
    background-color: rgb(236, 236, 236);
  }
  .channels-bar {
    display: flex;
    flex-direction: column;
    width: 240px;
    color: hsl(0, 0%, 95%);
    background-color: hsl(0, 0%, 20%);
  }
  .channels {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px;
    overflow-y: auto;
  }
  .category {
    font-size: 14px;
    margin: 5px 0;
  }
</style>
