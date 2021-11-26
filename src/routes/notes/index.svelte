<script context="module">
    // export const prerender = true
    export async function load({ fetch }) {
      const res = await fetch(`/notes.json`)
      if (res.ok) {
        const { notes } = await res.json()
        return {
          props: { notes },
        }
      }
    }
  </script>
  
  <script lang='ts'>
    export let notes
  </script>

<svelte:head>
  <title>Blog</title>
</svelte:head>
  
  <div class="flex flex-col flex-grow">
    <h2>读书笔记</h2>
    <hr />
    {#each notes as note}
      {#if !note.draft}
      <li> <a sveltekit:prefetch href={`/notes/${note.slug}`}>{note.title}</a> </li>
      {/if}
    {/each}
  </div>