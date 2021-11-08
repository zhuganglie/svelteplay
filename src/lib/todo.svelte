<script>
    import Close from 'svelte-material-icons/Close.svelte'
    import supabase from '$lib/db';

async function getData() {
const { data, error } = await supabase
.from('todos')
.select('*')
if (error) throw new Error(error.message)

 return data
}    

let size;
let newItem = ''
let submit = false

async function sendData() {
  const { data, error } = await supabase
    .from('todos')
    .insert([
      { 'text': newItem }
    ])
  if (error) throw new Error(error.message) 
  return data
}

async function deleteData(){
const { data, error } = await supabase
  .from('todos')
  .delete()
  .eq('id', '')

  if (error) throw new Error(error.message) 
  return data
}
</script>


{#await getData()}
  <p>Fetching data...</p>
{:then data}
{#each data as todo}
<div class="flex justify-between items-center">
	<span>{todo.text}</span>
	
    </div>
	<br/>
{/each} 
{:catch error}
  <p>Something went wrong while fetching the data:</p>
  <pre>{error}</pre>
{/await}

<form on:submit|preventDefault={() => submit = true} class="flex flex-col space-y-1">
    <input type="text" bind:value={newItem} placeholder="今天要做的事项" class="bg-gray-700 text-gray-300">
    <input type="submit" value="提交" on:click={() => submit = false} class="py-1 px-2 bg-gray-700 text-gray-300">
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
