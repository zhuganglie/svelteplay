<script context="module">
	const allPosts = import.meta.glob("../blog/*.{md,svx}");

    let body = [];
    for (let path in allPosts){
        body.push(
            allPosts[path]().then(({ metadata }) => {
                return {path, metadata };
            })
        );
    }

    export const load = async ({params}) => {
        const posts = await Promise.all(body);
        const tag = params.tag;
        const filteredPosts = posts.filter((post) => {
            return post.metadata.tags.includes(tag);
        })
        return { props: {
            filteredPosts,
            tag,
        },
    };
    };
</script>

<script>
    export let filteredPosts;
    export let tag;
</script>

<svelte:head>
    <title>Posts under tag</title>
</svelte:head>

<div class="flex space-x-2"> <div class="i-mdi-tag-multiple" /><h2>{tag}</h2></div>
<hr />
{#each filteredPosts as { path, metadata: { title, draft } }}
{#if !draft}
<li>
    <a href={`/blog/${path.replace(".md", "")}`}>{title}</a>
</li>
{/if}
{/each}
<hr />
<a href="/blog/" class="bg-zinc-700 text-yellow-500 hover:text-zinc-100 focus:text-zinc-100 rounded px-2.5 py-0.5">&larr; 返回列表</a>