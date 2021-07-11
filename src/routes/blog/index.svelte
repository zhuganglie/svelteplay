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

<script>
    import {formatDate} from '../../lib/date';
    export let posts;
</script>
<svelte:head>
    <title>Blog</title>
</svelte:head>

<h2>博 客</h2>
<hr />


{#each posts as {path, metadata: {title, date}}}
<div class="flex justify-between items-center">
    <a href={`/blog/${path.replace(".md", "").replace(".svx", "")}`} class="block mb-4 pb-4">{title}</a>
    <p class="block mb-4 pb-4">
        {formatDate(date)}
    </p>
</div>
{/each}
