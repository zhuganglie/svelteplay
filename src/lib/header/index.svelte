<script lang="ts">
	import { page } from '$app/stores';
	import ClickOutside from "svelte-click-outside";
  
    let open = false;
    const toggleHeader = () => {
    open = !open;}

	const routes = [
		{href: '/', name: '首页'},
		{href: '/blog', name: '博客'},
		{href: '/talks', name: '报告'},
		{href: '/recipe', name: '吃货'},
		{href: '/about', name: '关于'}
	]
</script>

<header class="sticky w-full sm:w-3/4 mx-auto bg-yellow-50 opacity-95 rounded-b-lg shadow-lg px-4 md:px-12 top-0 flex-shrink-0">
    <div class="container flex flex-wrap items-center justify-between px-3 mx-auto">
        <div class="flex items-center justify-center space-x-2">
    <img src="/images/avatar.jpeg" alt="avatar" width=48 height=48 class="m-2" />
    <a sveltekit:prefetch href="/" class="text-3xl font-bold text-green-900">一指禅</a>
    </div>
      <ClickOutside on:clickoutside="{() => (open = false)}">
      <button class="text-gray-900 cursor-pointer mr-1 md:hidden border-none focus:outline-none z-20" class:open on:click={toggleHeader}>
        <svg width=32 height=24>
          <line id="top" x1=0 y1=2  x2=32 y2=2/>
          <line id="middle" x1=0 y1=12 x2=24 y2=12/>
          <line id="bottom" x1=0 y1=22 x2=32 y2=22/>
        </svg>
      </button>
    </ClickOutside>

	<nav class="w-full ml-auto mt-4 text-lg  md:flex md:w-auto" class:hidden="{!open}">
		<ul class="list-none m-0 md:mb-0 md:flex md:items-center md:justify-center ">
			{#each routes as route}
			<li class="mx-1 my-4 md:my-1 px-1" class:bg-[#f5edc2]={$page.path === route.href} ><a sveltekit:prefetch href={route.href} class="block mx-2 my-1 md:inline-block">{route.name}</a></li>
			{/each}
		</ul>	
	</nav>
</div>
</header>

<style>
	svg {
		min-height: 24px;
		transition: transform 0.2s ease-in-out;
	}
	svg line {
		stroke: currentColor;
		stroke-width: 3;
		transition: transform 0.2s ease-in-out
	}
	.open svg {
		transform: scale(1)
	}
	.open #top {
		transform: translate(6px, 0px) rotate(45deg)
	}
	.open #middle {
		opacity: 0;
	}
  .open #bottom {
		transform: translate(-12px, 9px) rotate(-45deg)
	}
</style>
