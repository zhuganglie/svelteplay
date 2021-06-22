<script context="module">
	export const prerender = true;
	export async function load({ session }) {
		const posts = session.posts;
		return { props: { posts } };
	}
</script>

<script>
	export let posts;
	import { formatDate } from "../../lib/date";
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div>
	<h1>Posts</h1>
	<hr />
	{#each posts as post}
	<div class="flex justify-between items-center">
		<a
			href={`./blog/${post.slug}`}
			class="block mb-4 pb-4 last:border-none last:mb-0 font-bold"
		>
			{post.title}
		</a>
		<p>{formatDate(post.date)}</p>
	</div>
	{/each}
</div>