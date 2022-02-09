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
    //let menu = []
    let menu = sMeat.concat(sVeg)

    export function change() {
        sVeg = xVeg.sort(() => Math.random() - Math.random()). slice(0, 2)
        sMeat = xMeat.sort(() => Math.random() - Math.random()).slice(0, 2)
        menu = sMeat.concat(sVeg)
    }

    const rts = [
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000564/zh-cn?', title: '蛙功夫'},
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000524/zh-cn?', title: '史密斯湘菜馆'},
    {href: 'https://www.startaster.com.cn/phone.php/restaurant/RE000042/zh-cn?', title: '老成都'},
    {href: 'https://www.cqgf.com.sg/cn/', title: '重庆烤鱼'},
    {href: 'https://www.startaster.com.cn/restaurant/RE000020/zh-cn', title: '蟹老宋'}
  ]
  const yts = [
    {href: 'https://www.youtube.com/channel/UCg0m_Ah8P_MQbnn77-vYnYw', title: '美食作家'},
    {href: 'https://www.youtube.com/channel/UCBJmYv3Vf_tKcQr5_qmayXg', title: '老饭骨'},
    {href: 'https://www.youtube.com/channel/UCu7NhIfuD79werXU8I52oaQ', title: '山药视频'},
    {href: 'https://www.youtube.com/channel/UCmCuW1RdJA471zImbT2MdBQ', title: '铁锅视频'}
  ]
</script>

<h2>今天吃什么？</h2>
<hr />
<img src="/images/crab.jpeg" width="" alt="crab" loading="lazy" class="max-w-full rounded h-auto object-fill"/>
<p>上面 👆 这个问题给我带来了不少困扰。为此，我特地写了下面 👇 这个小程序。有了这个程序，不必动脑筋想菜名，只需点击按钮就可解决今天吃什么的问题，非常方便。</p>
<br>
<h3>随机菜单</h3>
<p>点击下面的按钮，会随机生成一个两荤两素的菜单，可无限次数更新哦。</p>

<button on:click={change} class=" px-1.5 py-0.5 mb-2 bg-zinc-700 text-yellow-500 rounded mb-6">点我更新</button>
<div class="md:flex md:items-center md:justify-center md:flex-wrap gap-4">
    {#each menu as item}
    <div class="mx-auto bg-zinc-700 w-4/5 md:w-1/5 px-4 py-4 mb-4 hover:scale-110">
    <a href="/blog/{item.Slug.rich_text[0].text.content}" class="text-zinc-300" ><h4>{item.Name.title[0].plain_text}</h4></a>
     <p class=""> {#each item.Tags.multi_select as i}
      <span class="bg-zinc-900 text-sm px-2 py-0.5 mr-2 rounded">{i.name}</span>
      {/each}
      </p>
      <p class="border-b max-w-max">类别：{item.Category.select.name}</p>
      </div>
    {/each}
    </div>
<br>
    <h3>他山之食</h3>
    <p>这里是一些我比较喜欢的油管美食频道和常去的本地中餐馆。</p>
    <div>
      <h5>油管</h5>
      <ul class="list-none flex flex-wrap">
      {#each yts as yt}
      <li><a href={yt.href} target="_blank" class="">{yt.title}</a></li>
      {/each}
      </ul>
    </div>
      
      <div>
        <h5>餐馆</h5>
        <ul class="flex flex-wrap list-none">
        {#each rts as rt}
        <li><a href={rt.href} target="_blank" class="">{rt.title}</a></li>
        {/each}
        </ul>
      </div>
  