<script context="module">
    export async function load({fetch}){
     const res = await fetch(`/food/database.json`)
     
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
    let x = data.map(data => data.properties)
    let xMeat = x.filter(x => x.Category.select.name === '荤菜')
    let xVeg = x.filter(x => x.Category.select.name === '素菜')
    let sMeat = xMeat.sort(() => Math.random() - Math.random()).slice(0,2)
    let sVeg = xVeg.sort(() => Math.random()- Math.random()).slice(0,2)
    let menu = sMeat.concat(sVeg)

    export function change() {
        sVeg = xVeg.sort(() => Math.random() - Math.random()). slice(0, 2)
        sMeat = xMeat.sort(() => Math.random() - Math.random()).slice(0, 2)
        menu = sMeat.concat(sVeg)
    }
</script>

<h2>今天吃什么？</h2>
<hr />
<img src="/images/crab.jpeg" width="" alt="crab" loading="lazy" class="max-w-full rounded h-auto object-fill"/>
<p>上面 👆 这个问题给我带来了不少困扰。为此，我特地写了下面 👇 这个小程序。有了这个程序，不必动脑筋想菜名，只需点击按钮就可解决今天吃什么的问题，非常方便。</p>
<h3>随机菜单</h3>
<p>点击下面的按钮，会随机生成一个两荤两素的菜单，可无限次数更新哦。</p>

<button on:click={change} class=" px-1.5 py-0.5 mb-2 bg-zinc-700 text-yellow-500 rounded mb-6">点我更新</button>
<div class="md:flex gap-4">
    {#each menu as item}
    <div class="mx-auto bg-zinc-700 w-4/5 md:w-1/4 p-4 mb-4 hover:scale-110">
    <h4>{item.Name.title[0].plain_text}</h4>
     <p class="flex gap-2"> {#each item.Tags.multi_select as i}
      <span class="bg-zinc-800 text-sm px-2 py-0.5 rounded">{i.name}</span>
      {/each}
      </p>
      <p class="border-b max-w-max">类别：{item.Category.select.name}</p>
      </div>
    {/each}
    </div>
  