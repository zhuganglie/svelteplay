<script>
  //import { onMount } from 'svelte';
  import dishes from "$lib/data/dish.json";
  let meatList = dishes.filter(dish => dish.type === '荤菜');
  let vegList = dishes.filter(dish => dish.type === '素菜');
    let veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
    let meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
    let menu = meat.concat(veg);
</script>

<svelte:head>
        <title>Recipe</title>
    </svelte:head>

  <h2>今天吃什么？</h2>
  <hr />
  

<h3>随机菜单</h3>
<button on:click={menu} class=" px-1.5 py-0.5 mb-2 text-green-50 bg-green-900 rounded ">更 新</button>
<ul>
  {#each menu as item}
   <li>{item.name} - {item.taste}</li>
  {/each}
</ul>
<h3>自选菜单</h3>

<h3>外卖菜单</h3>