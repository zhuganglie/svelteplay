<script context="module">
    export async function load({fetch}){
     const res = await fetch(`/test.json`)
    if(res.ok){
        const test = await res.json() 
        return {
            props: { test }
        }
    }
    }
</script>

<script>
    export let test
</script>

{#each test as item}
<li>
<a href={item.url}>
   {item.url}
</a>
</li>
{/each}