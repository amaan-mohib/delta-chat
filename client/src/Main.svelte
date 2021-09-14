<script>
  import { onDestroy, onMount } from "svelte";
  import { onAuthStateChanged } from "firebase/auth";
  import { Route, useNavigate, useLocation } from "svelte-navigator";
  import { auth, db } from "./utils/firebase";
  import { user } from "./utils/store";
  import Login from "./Views/Login.svelte";
  import Home from "./Views/Home.svelte";
  import PrivateRoute from "./Views/PrivateRoute/PrivateRoute.svelte";
  import Redirect from "./Redirect.svelte";
  import socket from "./utils/socket";
  import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
  import Profile from "./Views/Profile.svelte";

  let unsub;

  const navigate = useNavigate();
  const location = useLocation();
  onMount(() => {
    unsub = onAuthStateChanged(auth, async (res) => {
      // console.log(res);
      if (res) {
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
            banner: "",
          };
          await setDoc(doc(db, "users", res.uid), {
            uid: res.uid,
            email: res.email,
            displayName: res.displayName,
            photoURL: res.photoURL,
            createdAt: serverTimestamp(),
            rooms: [],
            banner: "",
          });
        }
        const from = ($location.state && $location.state.from) || "/";
        navigate(from, { replace: true });

        //socket
        socket.emit("join", { user: $user }, (error) => {
          if (error) console.error(error);
        });
      } else {
        // navigate("/login", { replace: true });
        user.set(null);
      }
    });
  });
  onDestroy(() => unsub && unsub());
</script>

<main>
  <Route path="/" component={Redirect} />
  <PrivateRoute path="/:room/:channel" let:location>
    <Home />
  </PrivateRoute>
  <PrivateRoute path="/settings" let:location>
    <Profile />
  </PrivateRoute>
  <Route path="/login" component={Login} />
</main>

<style>
  main {
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
