<script>
    export let tags;
  </script>
  
  <div class="mt-3 text-sm">
    {#each tags as tag}
      <a sveltekit:prefetch class="rounded-full bg-yellow-100 px-2 py-0.5 mx-1.5 " href="/tags/{tag}"
        >{tag}</a
      >
    {/each}
  </div>