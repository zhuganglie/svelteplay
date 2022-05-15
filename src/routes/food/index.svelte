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

<script lang="ts">
  import { Splide, SplideSlide } from '@splidejs/svelte-splide';
  import type { Options } from '@splidejs/splide';
  import '@splidejs/splide/dist/css/splide.min.css'; 

  const options: Options = {
    rewind : true,
    autoplay: false,
    type: 'fade',
    speed: 1000,
    perPage: 1,
    //focus: 'center',
    gap: '2rem',
    padding: '4rem',
    //direction: 'ttb',
    //width: 1000,
    cover: false,
    mediaQuery: 'max',
    breakpoints: {
      480: {
        perpage: 1,
        gap: '.7rem',
        padding: '2rem',
        arrows: true,
      },
    },
  }

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

<h1 class="text-3xl">今天吃什么？</h1>
<hr />
<img src="/images/crab.jpeg" width="" alt="crab" loading="lazy" class="max-w-full rounded h-auto object-fill"/>
<p>上面 👆 这个问题给我带来了不少困扰。为此，我特地写了下面 👇 这个小程序。有了这个程序，不必动脑筋想菜名，只需点击按钮就可解决今天吃什么的问题，非常方便。</p>
<br>
<h2 class="text-2xl">随机菜单</h2>
<p>点击下面的按钮，会随机生成一个两荤两素的菜单，可无限次数更新哦。</p>

<button on:click={change} class=" px-1.5 py-0.5 mb-2 bg-zinc-700 text-yellow-500 rounded mb-6">点我更新</button>
<div class="lg:flex lg:items-center lg:justify-center gap-2">
    {#each menu as item}
    <div class="mx-auto bg-zinc-700 w-full px-3 py-3 mb-4 rounded">
    <a href="/blog/{item.Slug.rich_text[0].text.content}" class="text-zinc-300" ><h4>{item.Name.title[0].plain_text}</h4></a>
     <p class="flex gap-2 lg:gap-6"> {#each item.Tags.multi_select as i}
      <div class="flex items-center justify-center gap-1">
      <div class="i-mdi-tag-outline" /><span>{i.name}</span>
      </div>
      {/each}
     </p>
      <p class="rounded bg-zinc-800 py-0.5 px-2 max-w-max">{item.Category.select.name}</p>
      </div>
    {/each}
    </div>
<br>
<h2 class="text-2xl">自选菜单</h2>
<p>如果不满意随机生成的菜单，可以在这里浏览全部菜品，点选自己喜欢吃的菜。</p>
<div class="w-full md:4/5">
<Splide options={options}>
  {#each x as i}
  <SplideSlide>
    <div class="mx-auto grid place-items-center bg-zinc-700 px-4 py-4 w-full lg:w-3/5">
      <a href="/blog/{i.Slug.rich_text[0].text.content}" class="text-zinc-300" ><h3 class="text-xl">{i.Name.title[0].plain_text}</h3></a>
       <p class="flex gap-6"> 
         {#each i.Tags.multi_select as i}
         <div class="flex items-center justify-center gap-1">
          <div class="i-mdi-tag-outline" /><span>{i.name}</span>
          </div>
        {/each}
       </p>
        <p class="rounded bg-zinc-800 py-0.5 px-2 max-w-max">{i.Category.select.name}</p>
        </div>
  </SplideSlide>
  {/each}
</Splide>
</div>

<br>
    <h2 class="text-2xl">他山之食</h2>
    <p>这里是一些我比较喜欢的油管美食频道和常去的本地中餐馆。</p>
    <div>
      <h3 class="text-xl">油管</h3>
      <ul class="list-none flex flex-wrap">
      {#each yts as yt}
      <li><a href={yt.href} target="_blank" class="">{yt.title}</a></li>
      {/each}
      </ul>
    </div>
      
      <div>
        <h3 class="text-xl">餐馆</h3>
        <ul class="flex flex-wrap list-none">
        {#each rts as rt}
        <li><a href={rt.href} target="_blank" class="">{rt.title}</a></li>
        {/each}
        </ul>
      </div>
  