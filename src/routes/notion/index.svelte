<script context="module">
    export async function load({fetch, Params}){
     const res = await fetch(`/notion/database.json`)
     
    if(res.ok){
        const notion = await res.json() 
        
        return {
            props:  { notion },
            revalidate: 1,
        }
    }
    }
</script>

<script>
    export let notion
</script>

<h2>食 谱</h2>
<hr />
{#each notion as item}
<div>
   <h4>{item.properties.Name.title[0].plain_text}</h4>
   <p>
   {#each item.properties.Tags.multi_select as i}
   <span class="mr-2">{i.name}</span>
   {/each}
   </p>
   <p>{item.properties.Recipe.rich_text[0].plain_text}</p>
   <p>{item.properties.URL.url}</p>
   <p>{item.properties.Slug.rich_text[0].plain_text}</p>
</div>
{/each}