<script lang="ts">
    import { page } from '$app/stores';
	import ClickOutside from "svelte-click-outside";
    import '../app.postcss';
    import MenuOpen from 'svelte-material-icons/MenuOpen.svelte';

    export let size = "1.625rem";

    let open = false;
    const toggleHeader = () => {
    open = !open;}

	const routes = [
		{href: '/', name: '首 页'},
		{href: '/blog', name: '博 客'},
		{href: '/talks', name: '报 告'},
		{href: '/recipe', name: '吃 货'},
		{href: '/about', name: '关 于'}
	]
</script>

<div class="flex h-screen">
    <aside class="flex md:flex flex-col items-center justify-around w-full md:w-1/5 border-r-4 border-gray-700 px-2 min-w-max" class:hidden={!open}>
   <header class="text-center">
       <p class="text-2xl font-bold">一指禅</p>
   <p class="text-sm">惯看秋月春风</p>
    </header>
   <nav>
    <ul class="list-none text-center m-0">
        {#each routes as route}
        <li class="my-4 mx-0 border-gray-300" class:border-b-2={$page.path === route.href}>
        <a sveltekit:prefetch href={route.href} class="block text-gray-300 hover:text-gray-100">{route.name}</a>
        </li>
        {/each}
    </ul>	
</nav>
<footer class="text-sm">
   <span>&copy 2020 - {new Date().getFullYear()}</span>
</footer>
</aside>
    <main class="pt-6 px-4 md:px-16 mx-auto w-full md:w-4/5 overflow-auto">
        <ClickOutside on:clickoutside="{() => (open = false)}">
        <button class:open on:click={toggleHeader} class="bg-gray-700 text-gray-300 px-2.5 py-0.5 mb-4 md:hidden shadow flex items-center space-x-1"><MenuOpen {size} /><span class="text-lg font-bold">一指禅</span></button>
    </ClickOutside>
        <slot />
    </main>
</div>