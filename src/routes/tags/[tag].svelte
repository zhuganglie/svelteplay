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

    export const load = async ({page}) => {
        const posts = await Promise.all(body);
        const tag = page.params.tag;
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
    import TagMultiple from "svelte-material-icons/TagMultiple.svelte"
    export let filteredPosts;
    export let tag;
    export let size = "2.25em"
</script>

<svelte:head>
    <title>Posts under tag</title>
</svelte:head>

<div class="flex space-x-2"><TagMultiple { size } /> <h2>{tag}</h2></div>
<hr />
{#each filteredPosts as { path, metadata: { title } }}
<li>
    <a href={`/blog/${path.replace(".md", "")}`}>{title}</a>
</li>
{/each}
<hr />
<a href="/blog/" class="bg-green-900 text-gray-50 hover:text-gray-100 focus:text-gray-100 rounded px-2.5 py-0.5">&larr; 返回列表</a>