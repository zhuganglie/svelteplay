<script>
  import dishes from "$lib/data/dish.json";
  export let meatList = dishes.filter(dish => dish.type === '荤菜');
  export let vegList = dishes.filter(dish => dish.type === '素菜');
  

  const veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
  const meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
  const menu = meat.concat(veg)
  function handleClick(){ }
 
</script>

<svelte:head>
        <title>Recipe</title>
    </svelte:head>

  <h2>今天吃什么？</h2>
  <hr />
  

<h3>随机菜单</h3>
<button on:click={handleClick} class="border-2 px-1.5 py-0.5 mb-2 text-green-900 border-green-900 bg-green-50 rounded ">猛击这里</button>
<ul>
  {#each menu as item}
   <li>{item.name} - {item.taste}</li>
  {/each}
</ul>
<h3>自选菜单</h3>

<h3>外卖菜单</h3>