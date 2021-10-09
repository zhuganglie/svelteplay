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
  
  const rts = [
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000564/zh-cn?', title: '蛙功夫'},
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000524/zh-cn?', title: '湘菜馆'},
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000042/zh-cn?', title: '老成都'},
    {href: 'https://www.cqgf.com.sg/cn/', title: '渝烤鱼'}
  ]
  const yts = [
    {href: 'https://www.youtube.com/channel/UCg0m_Ah8P_MQbnn77-vYnYw', title: '厨师长'},
    {href: 'https://www.youtube.com/channel/UCBJmYv3Vf_tKcQr5_qmayXg', title: '老饭骨'},
    {href: 'https://www.youtube.com/channel/UCu7NhIfuD79werXU8I52oaQ', title: '山药村'},
    {href: 'https://www.youtube.com/channel/UCU26E5h_p3SAsCK30-DFy2w', title: '小食哥'}
  ]
</script>


<svelte:head>
        <title>Recipe</title>
    </svelte:head>

  <h2>今天吃什么？</h2>
  <hr />
  
<h3>随机菜单</h3>
<button on:click={change} class=" px-1.5 py-0.5 mb-2 text-green-50 bg-green-900 rounded ">点我更新</button>
<ul>
  {#each menu as item}
   <li>{item.name} - {item.taste}</li>
  {/each}
</ul>

<h3>自选菜单</h3>
<div class="w-full md:w-1/2 mb-4">
<Select items={complexItems} isMulti={true} on:select={handleSelect} />
</div>
{#if selected}
<ul>
{#each selected as se}
	<li> {se.label}</li>
  {/each}
</ul>
{/if}

<h3>他山之食</h3>
<div class="">
<div>
  <h5>油管</h5>
  {#each yts as yt}
  <li><a href={yt.href} target="_blank" class="">{yt.title}</a></li>
  {/each}
</div>
  
  <div>
    <h5>餐馆</h5>
    {#each rts as rt}
    <li><a href={rt.href} target="_blank" class="">{rt.title}</a></li>
    {/each}
  </div>
  </div>

