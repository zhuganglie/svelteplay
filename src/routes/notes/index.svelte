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
  <title>Notes</title>
</svelte:head>
  
  
    <h2>读 书</h2>
    <hr />
    {#each notes as note}
      {#if !note.draft}
    <div class="mb-6">
        <a sveltekit:prefetch href={`/notes/${note.slug}`} class="text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2">{note.title}</a>
        <div class="flex flex-wrap justify-start ml-4">
          {#each note.categories as category}
            <a sveltekit:prefetch class="flex items-center justify-center py-0.5 px-2.5 mr-1.5 my-1 text-sm bg-zinc-700 rounded text-zinc-300 hover:text-zinc-100" href="/categories/{category}"
              > {category}</a>
          {/each}
          </div>
       </div>
      {/if}
    {/each}
  