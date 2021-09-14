<script>
  import { useNavigate, useLocation } from "svelte-navigator";
  import { user } from "../../utils/store";

  const navigate = useNavigate();
  const location = useLocation();

  $: if (!$user) {
    console.log("navigating");
    navigate("/login", {
      state: { from: $location.pathname },
      replace: true,
    });
  }
</script>

{#if $user}
  <slot />
{/if}
