<script context="module">
 const allPosts = import.meta.glob("./*.{md,svx}");
 let body = [];
 for(let path in allPosts) {
     body.push(
     allPosts[path]().then(({metadata}) => {
        return {path, metadata};
     })
     ); 
 }

 export const load = async() => {
     const posts = await Promise.all(body);
     
     return {
         props: {
             posts,
         },
     };
 };
</script>

<script lang="ts">
    import {formatDate} from '$lib/date';
    export let posts;
    const dateSortedPosts = posts.slice().sort((a, b) => {
        return Date.parse(b.metadata.date) - Date.parse(a.metadata.date);
    });  
</script>

<svelte:head>
    <title>Blog</title>
</svelte:head>

<h1 class="text-3xl">博客文章</h1>
<hr />

{#each dateSortedPosts as {path, metadata: {title, date, tags, draft}}}
{#if !draft}
    <div class=" mb-4">
       <span class="text-sm border-b border-zinc-300 px-2 py-0.5 mb-3 min-w-max"> {formatDate(date)}</span> <br /> <br />
    <a href={`/blog/${path.replace(".md", "").replace(".svx", "")}`} class="text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2">{title}</a>
    
    <div class="flex flex-wrap justify-start">
        {#each tags as tag}
          <a sveltekit:prefetch class="flex items-center justify-center py-0.5 px-2.5 mr-1.5 my-1 text-sm bg-zinc-700 rounded text-zinc-300 hover:text-zinc-100" href="/tags/{tag}"
            ><div class="i-mdi-tag-outline mr-1 " /> {tag}</a>
        {/each}
        </div>
      </div>
    <hr />
    {/if}
{/each}

