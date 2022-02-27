<script context="module">
    // export const prerender = true
    export async function load({ fetch }) {
      const res = await fetch(`/blog.json`)
      if (res.ok) {
        const { posts } = await res.json()
        return {
          props: { posts },
        }
      }
    }
  </script>
  
  <script lang='ts'>
    export let posts;
    import {formatDate} from '$lib/date';
  </script>

<svelte:head>
  <title>Posts</title>
</svelte:head>
  
  
    <h1 class="text-3xl">博 客</h1>
    <hr />
    
    {#each posts as item}
    {#if !item.draft}
    <div class="mb-4">
    <span class="text-sm border-b border-zinc-300 px-2 py-0.5 mb-3 min-w-max">{formatDate(item.date)}</span>
    <br > <br>
    <a href="/blog/{item.slug}" class="text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2">{item.title}</a>
    <div class="flex flex-wrap justify-start">
      {#each item.tags as tag}
        <a sveltekit:prefetch class="flex items-center justify-center py-0.5 px-2.5 mr-1.5 my-1 text-sm bg-zinc-700 rounded text-zinc-300 hover:text-zinc-100" href="/tags/{tag}"
          ><div class="i-mdi-tag-outline mr-1 " /> {tag}</a>
      {/each}
      </div>
      </div>
  <hr />
    {/if}
    {/each}
    