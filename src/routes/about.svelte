<script context="module">
	//import { browser, dev } from '$app/env';

	// we don't need any JS on this page, though we'll load
	// it in dev so that we get hot module replacement...
	//export const hydrate = dev;

	// ...but if the client-side router is already loaded
	// (i.e. we came here from elsewhere in the app), use it
	//export const router = browser;

	// since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
	export const prerender = true;
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<h2>关 于</h2>
<hr />

<p><strong>嗨，你好！欢迎来到我的小站。 </strong></p>
    <p>我，网名猪刚烈，是一名如假包换的小人物。</p>
    <p>生活中，我是一个乐天派。我相信办法总比问题多，相信没有什么过不去的坎儿，相信事情总会向好的方向转化。遇到问题的时候，别人急得跳脚，我却能淡定自若，表现得跟没事儿一样。因为这样的性格，常常被某个人骂“没心没肺”。下面这张图画出了我这种性格背后的逻辑。</p>
    <img src="/images/attitude.png" alt="attitude"  loading="lazy" class="w-full md:w-1/2 block ml-auto mr-auto my-8"/>
     <p>我求知强，因而特别喜欢读书学习。书店是常去的地方。刚开始工作那会儿，收入微薄，生活捉襟见肘，但每月仍会拿出薪水的七分之一来购买书籍。到我辞职的时候，家里的书房几乎成了迷你图书馆。我的阅读范围并不广，仅局限于哲学、社会科学和科普，对小说完全没有兴趣。《红楼梦》读几行就想睡觉，《自杀论》却可以读通宵而不知疲倦。得益于阅读，我能清楚地理解抽象的哲学概念，也能处理棘手的组织管理问题，还能欣赏诗词歌赋中蕴涵的意境。我是读者，也是作者，发表过若干章节、译作，和论文。我的作品看的人不多，但看了的都说好。</p>

    <p>我兴趣广泛，喜欢远足，喜欢骑脚踏车，喜欢听古典音乐，喜欢品茶，喜欢做美食......。我最大的嗜好是下围棋。从大学一年级开始一直下到现在。围棋是富有哲理的游戏，我从中领悟了不少道理。譬如，围棋中的弃子取胜之道就让我懂得有舍才有得，会舍才会得。</p>

    <p>最近, 我又对网站开发产生了浓厚的兴趣，于是就开始了一段 HTML、CSS 和 Javascript 的学习之旅。你现在正在浏览的这个网站就是这次学习的一个初步成果，它是基于 <a href="https://kit.svelte.dev/" target="_blank" rel="noreferrer">Sveltekit</a> 和 <a href="https://tailwindcss.com" target="_blank" rel="noreferrer">Tailwindcss</a> 技术构建的。怎么样？看上去还不错吧？<span role="img" aria-label="Smile">&#128522;</span>
    </p>

	