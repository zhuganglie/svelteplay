<script context="module">
export const load = async ({ fetch }) => {
		const res = await fetch(`../notes.json`)
		let { notes } = await res.json()
    let uniqueCategories = {}
    notes.forEach(note => {
      note.categories.forEach(category => {
        if (uniqueCategories.hasOwnProperty(category)) {
          uniqueCategories[category].count += 1
        } else {
          uniqueCategories[category] = {
            title: category,
            count: 1
          }
        }
      })
    })
    const sortedUniqueCategories = 
      Object.values(uniqueCategories)
        .sort((a, b) => a.title > b.title)
		return {
			props: { 
        uniqueCategories: sortedUniqueCategories
      }
		}
	}
</script>


<script>
  export let uniqueCategories
</script>


<svelte:head>
  <title>Notes | Categories</title>
</svelte:head>


<div class="">
  <h1 class="text-3xl">笔记分类</h1>
  <hr />
  
  <ul>
    {#each uniqueCategories as category}
    <li>
      <a href="/categories/{category.title}">
        { category.title }
      </a>
      ({category.count})
    </li>
    {/each}
  </ul>
</div>
