<script context="module">
export const load = async ({ fetch }) => {
		const res = await fetch(`../blog.json`)
		let { posts } = await res.json()
    let uniqueTags = {}
    posts.forEach(post => {
      post.tags.forEach(tag => {
        if (uniqueTags.hasOwnProperty(tag)) {
          uniqueTags[tag].count += 1
        } else {
          uniqueTags[tag] = {
            title: tag,
            count: 1
          }
        }
      })
    })
    const sortedUniqueTags = 
      Object.values(uniqueTags)
        .sort((a, b) => a.title > b.title)
		return {
			props: { 
        uniqueTags: sortedUniqueTags
      }
		}
	}
</script>


<script>
  export let uniqueTags
</script>


<svelte:head>
  <title>Posts | Tags</title>
</svelte:head>


<div class="">
  <h1 class="text-3xl">标 签</h1>
  <hr />
  
  <ul>
    {#each uniqueTags as tag}
    <li>
      <a href="/tags/{tag.title}">
        { tag.title }
      </a>
      ({tag.count})
    </li>
    {/each}
  </ul>
</div>
