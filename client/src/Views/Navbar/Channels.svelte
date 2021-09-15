<script>
  import Channel from "../../components/Channel.svelte";
  import { selectedChannel, selectedRoom, user } from "../../utils/store";
  import { collection, query, onSnapshot, where } from "firebase/firestore";
  import { db } from "../../utils/firebase";
  import { onDestroy } from "svelte";
  import { useParams } from "svelte-navigator";
  import ProfileBar from "../../components/ProfileBar.svelte";

  // const channels = [
  //   {
  //     name: "first",
  //     type: "✏️",
  //   },
  // ];

  let unsub;
  let dms;
  let channels = [];
  let vcs = [];
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
        window.history.replaceState(
          {},
          `${$selectedChannel.name}`,
          `/me/${$selectedChannel.id}`
        );
        // // if (channelID !== "friends") {
        // const q = query(
        //   collection(db, "dms"),
        //   where("participants", "array-contains", $user.uid)
        // );
        // dms = onSnapshot(q, (querySnapshot) => {
        //   let allDms = querySnapshot.docs.map((doc) => doc.data());
        //   if (allDms.length > 0) {
        //     channels.push(...allDms);
        //     let filteredRoom = channels.filter(
        //       (dm) => dm.participants === channelID.split("_")
        //     );
        //     console.log(channels, filteredRoom);
        //     $selectedChannel =
        //       filteredRoom.length > 0 ? filteredRoom[0] : channels[0];
        //   } else {
        //     $selectedChannel = channels[0];
        //   }
        //   window.history.replaceState(
        //     {},
        //     `${$selectedChannel.name}`,
        //     `/me/${$selectedChannel.id}`
        //   );
        // });
        // } else {
        //   $selectedChannel = channels[0];
        //   window.history.replaceState(
        //     {},
        //     `${$selectedChannel.name}`,
        //     `/me/friends`
        //   );
        // }
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

  onDestroy(() => {
    unsub && unsub();
    dms && dms();
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
    {#each channels as channel (channel.id)}
      <Channel
        id={channel.id}
        name={channel.name}
        type={channel.typeIcon}
        on:click={() => {
          changeURLChannel(channel);
        }}
      />
    {/each}
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
    /* padding-bottom: 0; */
  }
</style>
