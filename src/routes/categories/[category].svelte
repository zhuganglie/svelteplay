<script context="module">
	export const load = async ({ fetch, params }) => {
    const category = params.category
    const res = await fetch(`../notes.json`)
		let { notes } = await res.json()
    const matchingNotes = notes
      .filter(note => note.categories.includes(category))
		return {
			props: { 
        notes: matchingNotes,
        category
      }
		}
} 
</script>

<script>
	export let notes
  export let category
</script>

<svelte:head>
	<title>Category: {category}</title>
</svelte:head>


<h2>分类： {category}</h2>
<hr />

{#if notes.length}
  <ul class="">
    {#each notes as note}
      <li>
          <a href="/notes/{note.slug}">
            {note.title}
          </a>
      </li>
    {/each}
  </ul>
{:else}
  <p><strong>Ope!</strong> Sorry, couldn't find any note in the category "{category}".</p>

  <p><a href="/notes">返回读书页</a></p>
{/if}
