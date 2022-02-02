<script context="module">
    export async function load({fetch, Params}){
     const res = await fetch(`/notion.json`)
     
    if(res.ok){
        const test = await res.json() 
        
        return {
            props:  { test }
        }
    }
    }
</script>

<script>
    export let test
</script>

{#each test as item}
<li>
   {item.properties.Name.title}
</li>
{/each}