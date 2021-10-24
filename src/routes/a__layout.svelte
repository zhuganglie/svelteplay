<script lang="ts">
    import { page } from '$app/stores';
	import ClickOutside from "svelte-click-outside";
    import '../app.postcss';

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

<div class="flex h-screen">
    <aside class="md:block w-full md:w-1/5 border-r-2 border-green-900" class:hidden="{!open}">
   <header>渔樵耕读</header>
   <nav>
    <ul class="">
        {#each routes as route}
        <li class="mx-1 my-4 md:my-1 px-1" class:bg-[#f5edc2]={$page.path === route.href} ><a sveltekit:prefetch href={route.href} class="block mx-2 my-1 md:inline-block">{route.name}</a></li>
        {/each}
    </ul>	
</nav>
<footer>
   <span>&copy 2020 - {new Date().getFullYear()}</span>
</footer>
    </aside>
    <main class="pt-8 px-4 md:px-16 mx-auto w-full md:w-4/5 overflow-auto">
        <ClickOutside on:clickoutside="{() => (open = false)}">
        <button class:open on:click={toggleHeader} class="bg-green-900 text-gray-50 px-2.5 py-0.5 md:hidden">渔樵耕读</button>
    </ClickOutside>
        <slot />
    </main>
</div>