<script context="module">
	export const load = async ({ fetch, params }) => {
    const tag = params.tag
    const res = await fetch(`../blog.json`)
		let { posts } = await res.json()
    const matchingPosts = posts.filter(post => post.tags.includes(tag))
		return {
			props: { 
        posts: matchingPosts,
        tag
      }
		}
} 
</script>

<script>
	export let posts
  export let tag
  console.log(posts)
</script>

<svelte:head>
	<title>Tag: {tag}</title>
</svelte:head>


<h2>标签： {tag}</h2>
<hr />

{#if posts.length}
  <ul class="">
    {#each posts as post}
      <li>
          <a href="/blog/{post.slug}">
            {post.title}
          </a>
      </li>
    {/each}
  </ul>
{:else}
<p><strong>Ope!</strong> Sorry, couldn't find any note under the tag "{tag}".</p>

  <p><a href="/blog">返回列表页</a></p>

{/if}