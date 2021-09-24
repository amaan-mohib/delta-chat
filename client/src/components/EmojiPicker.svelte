<script>
  import emoji from "../assets/emoji";

  export let typeIcon;
  let custom = "";

  const onClick = (value) => {
    custom = "";
    typeIcon = value;
  };
  const changeOnCustom = (e) => {
    typeIcon = e.target.value;
  };
</script>

<div class="emoji-picker">
  <div class="emoji-grid">
    {#each emoji as e}
      <div
        class="emoji"
        title={e.title}
        on:click={() => {
          onClick(e.icon);
        }}
      >
        {e.icon}
      </div>
    {/each}
  </div>
  <hr />
  <div class="flex">
    <input
      maxlength="2"
      placeholder="Custom"
      type="text"
      bind:value={custom}
      on:input={changeOnCustom}
      style="width: 120px;"
    />
    <i class="grey-text size12" style="margin-top: 10px;"
      >Hint: Press <kbd>Win</kbd> + <kbd>.</kbd></i
    >
  </div>
</div>

<style>
  .emoji-picker {
    position: absolute;
    background-color: hsl(0, 0%, 20%);
    padding: 5px;
    border-radius: 5px;
    margin: 8px 0;
    box-shadow: 0 0px 5px 2px rgb(0 0 0 / 50%);
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: auto auto auto;
    gap: 5px;
  }
  .emoji {
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
  }
  .emoji:hover {
    cursor: pointer;
    background-color: hsl(0, 0%, 15%);
  }
  .flex {
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: 5px;
  }
  kbd {
    font-family: monospace !important;
    background-color: #eee;
    border-radius: 3px;
    border: 1px solid #b4b4b4;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
      0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
    color: #333;
    display: inline-block;
    font-size: 0.85em;
    font-weight: 700;
    line-height: 1;
    padding: 2px 4px;
    white-space: nowrap;
  }
  hr {
    border: none;
    height: 1px;
    background-color: rgb(236, 236, 236);
  }
</style>
