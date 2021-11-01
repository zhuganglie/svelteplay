<script>
    import dishes from "$lib/data/dish.json";
    import Select from "svelte-select";
  
    const complexItems = dishes.map(dish => dish.name);
    let selected = [];
    function handleSelect(event) {
      selected = event.detail
    }
    
    let meatList = dishes.filter(dish => dish.type === '荤菜');
    let vegList = dishes.filter(dish => dish.type === '素菜');
    let veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
    let meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
    let menu = meat.concat(veg);
  
    export function change() {
      veg = vegList.sort(() => Math.random() - Math.random()).slice(0, 2);
      meat = meatList.sort(() => Math.random() - Math.random()).slice(0, 2);
      menu = meat.concat(veg);
    }
  </script>

  <h5>今天吃什么？</h5>
  <hr />
  <button on:click={change} class="max-w-max px-1.5 py-0.5 mt-8 mb-4 bg-gray-700 text-yellow-500 rounded ">点我更新</button>
  
  <table class="text-center"> 
    <tr>
    <th>菜名</th>
    <th>味道</th>
    </tr>
    {#each menu as item}
    <tr>
      <td>{item.name}</td>
      <td>{item.taste}</td>
    </tr>
    {/each}
  </table>

    <style>
        
        table, td, th {
          border: 1px solid rgba(55, 65, 81, var(--tw-text-opacity));
        }
        td, th {
          padding: 0.5rem;
        }
      </style>