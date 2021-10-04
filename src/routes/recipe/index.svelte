<script>
  import dish from "$lib/data/dish.json";
  let meat;
  let veg;
</script>

<svelte:head>
        <title>Recipe</title>
    </svelte:head>

  <h2>今天吃什么？</h2>
  <hr />
  


  {#each dish as item}
   <li>{item.name}</li>
  {/each}