<script>
    import supabase from '$lib/db'
    let newRecipe
    let submit = false

    async function getData() {
        const { data, error } = await supabase.from('recipe').select().eq('category', '荤菜').limit(3)
          if (error) throw new Error(error.message)
      console.log(data)
          return data
      }

    async function sendData() {
      const { data, error } = await supabase
        .from('recipe')
        .insert([
          { 'name': newRecipe }
        ])
      if (error) throw new Error(error.message)
      return data
    }
  </script>
  
  <h1>My favorite recipe</h1>
  {#await getData()}
    <p>Fetching data...</p>
  {:then data}
    {#each data as item}
      <li>{item.name}</li>
    {/each}
  {:catch error}
    <p>Something went wrong while fetching the data:</p>
    <pre>{error}</pre>
  {/await}
  
  <form on:submit|preventDefault={() => submit = true}>
    <input type="text" bind:value={newRecipe}>
    <input type="submit" value="Submit" on:click={() => submit = false}>
  </form>
  {#if submit}
    {#await sendData()}
      <p>Sending data...</p>
    {:then data}
      <p>Succesfully sent data.</p>
    {:catch error}
      <p>Something went wrong while sending the data:</p>
      <pre>{error}</pre>
    {/await}
  {/if}