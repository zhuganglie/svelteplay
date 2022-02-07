<script context="module">
    export async function load({fetch, Params}){
     const res = await fetch(`/notion/database.json`)
     
    if(res.ok){
        const data = await res.json() 
        
        return {
            props:  { data },
            revalidate: 1,
        }
    }
    }
</script>

<script>
    export let data
</script>

<h2>食 谱</h2>
<hr />
<div class="flex flex-col md:flex-row md:flex-wrap items-center justify-center place-self-center gap-4 ">
{#each data as item}
<div class="bg-zinc-700 w-full md:w-48 h-auto rounded p-4 grid place-items-center my-4">
   <h3>{item.properties.Name.title[0].plain_text}</h3>
   <p>{item.properties.Recipe.rich_text[0].plain_text}</p>
  <!--- <p>{item.properties.URL.url}</p>
   <p>{item.properties.Slug.rich_text[0].plain_text}</p> -->
   <p>
    {#each item.properties.Tags.multi_select as i}
    <span class="mr-2 rounded px-2 py-0.5 bg-zinc-900">{i.name}</span>
    {/each}
    </p>
</div>
{/each}
</div>