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
    import {formatDate} from '../../lib/date';
    export let posts;
    const dateSortedPosts = posts.slice().sort((a, b) => {
        return Date.parse(b.metadata.date) - Date.parse(a.metadata.date);
    });  
</script>

<svelte:head>
    <title>Blog</title>
</svelte:head>

<h2>博 客</h2>
<hr />

{#each dateSortedPosts as {path, metadata: {title, date, tags}}}
<div class="flex justify-between">
    <div class="mb-4 pb-4 ">
    <a href={`/blog/${path.replace(".md", "").replace(".svx", "")}`} class="text-md text-left mb-2 text-gray-900">{title}</a>
    <div class="flex justify-start">
        {#each tags as tag}
          <a sveltekit:prefetch class="rounded bg-gray-100 px-2 py-0.5 mx-1.5 text-sm " href="/tags/{tag}"
            >{tag}</a>
        {/each}
        </div>
      </div>
    <p class="block mb-4 pb-4 text-base">
        {formatDate(date)}
    </p>
</div>
{/each}

