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
  
  
    <h1 class="text-3xl">读 书</h1>
    <hr />
    <div class="grid place-items-center place-content-center grid-cols-1 md:grid-cols-3 gap-2">
    {#each notes as note}
      {#if !note.draft}
    <div class="bg-zinc-700/60 gap-2 p-4 rounded shadow-lg w-full">
        <a sveltekit:prefetch href={`/notes/${note.slug}`} class="text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2">{note.title}</a>
        <div class="flex flex-wrap justify-start ml-4">
          {#each note.categories as category}
            <a sveltekit:prefetch class="flex items-center justify-center py-0.5 px-2.5 mr-1.5 my-1 text-sm bg-zinc-900 rounded text-zinc-300 hover:text-zinc-100" href="/categories/{category}"
              > {category}</a>
          {/each}
          </div>
       </div>
      {/if}
    {/each}
    </div>
  