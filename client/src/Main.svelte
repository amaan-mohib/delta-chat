<script>
  import { onDestroy, onMount } from "svelte";
  import { onAuthStateChanged } from "firebase/auth";
  import { Route, useNavigate, useLocation } from "svelte-navigator";
  import { analytics, auth, db } from "./utils/firebase";
  import { user } from "./utils/store";
  import Login from "./Views/Login.svelte";
  import Home from "./Views/Home.svelte";
  import PrivateRoute from "./Views/PrivateRoute/PrivateRoute.svelte";
  import Redirect from "./Redirect.svelte";
  import Loader from "./components/Loader.svelte";
  import socket from "./utils/socket";
  import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
  import Invite from "./Views/Invite.svelte";
  import delta from "./assets/images/delta.svg";
  import NotFound from "./Views/NotFound.svelte";
  import { logEvent } from "@firebase/analytics";

  let unsub;
  let loading = true;
  let status = "Authenticating";

  const navigate = useNavigate();
  const location = useLocation();

  const getServer = () => {
    return new Promise((resolve, reject) => {
      fetch("http://localhost:3000/")
        .then((res) => {
          if (res.status === 200) resolve("ok");
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  };

  onMount(() => {
    unsub = onAuthStateChanged(auth, async (res) => {
      // // console.log(res);
      if (res) {
        logEvent(analytics, "login");
        if (socket.disconnected) {
          socket.connect();
        }
        const userRef = doc(db, "users", res.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          $user = snap.data();
        } else {
          $user = {
            uid: res.uid,
            email: res.email,
            displayName: res.displayName,
            photoURL: res.photoURL,
            createdAt: Date.now(),
            rooms: [],
            dms: [],
          };
          await setDoc(doc(db, "users", res.uid), {
            uid: res.uid,
            email: res.email,
            displayName: res.displayName,
            photoURL: res.photoURL,
            createdAt: serverTimestamp(),
            rooms: [],
            dms: [],
          });
        }
        status = "Connecting to server";
        const response = await getServer();
        if (response === "ok") {
          status = "";
          loading = false;
        }
        const from = ($location.state && $location.state.from) || "/";
        navigate(from, { replace: true });

        //socket
        socket.emit("join", { user: $user }, (error) => {
          if (error) console.error(error);
        });
      } else {
        loading = false;
        socket.removeAllListeners();
        socket.disconnect();
        user.set(null);
      }
    });
  });
  onDestroy(() => unsub && unsub());
</script>

<main>
  {#if loading}
    <div class="main">
      <div class="block">
        <h1 style="display: flex; align-items:center">
          <img src={delta} alt="delta" class="delta" />Chat
        </h1>
        <p class="grey-text size14">{status}</p>
      </div>
      <Loader />
    </div>
  {/if}
  <div class="app" style="display:{loading ? 'none' : 'flex'}">
    <Route path="/" component={Redirect} />
    <PrivateRoute path="/:room/:channel" let:location>
      <Home />
    </PrivateRoute>
    <PrivateRoute path="/invite/:room" let:location>
      <Invite />
    </PrivateRoute>
    <Route path="/login" component={Login} />
    <Route component={NotFound} />
  </div>
</main>

<style>
  main,
  .app {
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .main {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }
  .block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .block > * {
    margin: 5px 0;
  }
  .delta {
    width: 0.85em;
    margin-right: 5px;
  }
</style>
