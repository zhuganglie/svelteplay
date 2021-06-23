<script lang="ts">
	import { page } from '$app/stores';
	import ClickOutside from "svelte-click-outside";
  
    let open = false;
    const toggleHeader = () => {
    open = !open;}
</script>

<header class="sticky m-auto h-20 flex justify-between items-center w-full h-18 bg-yellow-50 shadow-lg px-4 md:px-12 top-0">
    <div class="flex flex-wrap items-center">
    <img src="/images/avatar.jpeg" alt="avatar" width=48 height=48 class="m-0" />
    <a sveltekit:prefetch href="/" class="text-3xl font-bold hover:text-red-900 hover:bg-yellow-50">一指禅</a>
    </div>
      <ClickOutside on:clickoutside="{() => (open = false)}">
      <button class="text-red-900 cursor-pointer mr-1 md:hidden border-none focus:outline-none" class:open on:click={toggleHeader}>
        <svg width=32 height=24>
          <line id="top" x1=0 y1=2  x2=32 y2=2/>
          <line id="middle" x1=0 y1=12 x2=24 y2=12/>
          <line id="bottom" x1=0 y1=22 x2=32 y2=22/>
        </svg>
      </button>
    </ClickOutside>

	<nav class="w-full ml-auto text-lg font-medium md:flex md:w-auto" class:hidden="{!open}">
		<ul class="list-none m-0 md:flex">
			<li class:active={$page.path === '/'} ><a sveltekit:prefetch href="/" class="block mt-4 mr-4 md:inline-block md:mt-0">Home</a></li>
			<li class:active={$page.path === '/blog'} ><a sveltekit:prefetch href="/blog" class="block mt-4 mr-4 md:inline-block md:mt-0">Blog</a></li>
			<li class:active={$page.path === '/talks'} ><a sveltekit:prefetch href="/talks" class="block mt-4 mr-4 md:inline-block md:mt-0">Talks</a></li>
			<li class:active={$page.path === '/about'} ><a sveltekit:prefetch href="/about" class="block mt-4 mr-4 md:inline-block md:mt-0">About</a></li>
		</ul>	
	</nav>
</header>

<style>
	
	.active {
		font-weight: 700;
	}
	svg {
		min-height: 24px;
		transition: transform 0.2s ease-in-out;
	}
	
	svg line {
		stroke: currentColor;
		stroke-width: 3;
		transition: transform 0.2s ease-in-out
	}
	
	button {
		z-index: 20;
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
