
<script lang="ts">
    import { page } from '$app/stores';
	import ClickOutside from "svelte-click-outside";
    //import '../app.postcss';
    import 'uno.css';
    import '@unocss/reset/tailwind.css';
    import '../global.css';
    import Contact from '../lib/contact.svelte';
    
    let open = false;
    const toggleHeader = () => {
    open = !open;}

	const routes = [
		{href: '/', icon:'i-mdi-home-outline', name: '首 页'},
		{href: '/blog', icon:'i-mdi-post-outline', name: '博 客'},
        {href: '/notes', icon:'i-mdi-book-outline', name: '读 书'},
		{href: '/talks', icon:'i-mdi-presentation', name: '报 告'},
		{href: '/food', icon:'i-mdi-food-outline', name: '吃 货'},
		{href: '/about', icon:'i-mdi-account-outline', name: '关 于'}
	]
</script>

<div class="flex h-screen">
    <aside class="hidden md:flex flex-col items-center justify-evenly w-full md:w-1/5 border-r-4 border-zinc-700 px-2 min-w-max" class:flex={open}>
   <header class="text-center">
       <p class="text-2xl font-bold">一指禅</p>
   <p class="text-sm text-yellow-500">惯看秋月春风</p>
    </header>
   <nav>
    <ul class="list-none text-center m-0">
        {#each routes as route}
        <li class="my-4 mx-0 border-zinc-300 " >
    <a sveltekit:prefetch href={route.href} class=" text-zinc-300 hover:text-zinc-100 flex items-center justify-center space-x-4"><div class="{route.icon}"/><span class:border-b-2={$page.url.pathname === route.href}>{route.name}</span></a>
        </li>
        {/each}
    </ul>	
</nav>
<footer class="text-sm">
   <span>&copy 2020 - {new Date().getFullYear()}</span>
</footer>
</aside>

    <main class="pt-8 px-4 md:px-6 mx-auto w-full md:w-3/5 overflow-auto">
        <ClickOutside on:clickoutside="{() => (open = false)}">
        <button class:open on:click={toggleHeader} class="bg-zinc-700 text-yellow-500 px-2.5 py-0.5 mb-6 md:hidden shadow rounded  flex items-center space-x-1"><span class="i-mdi-menu-right-outline icon" /><span class="text-lg font-bold">一指禅</span></button>
    </ClickOutside>
        <slot />
    </main>
    <div class="md:grid self-center justify-self-center text-center mx-auto px-6 hidden md:w-1/5">
        <h4>联系我</h4>
        <Contact />
    </div>
</div>



<style>
    .open .icon {
     transform: rotate(-180deg);
    }
</style>