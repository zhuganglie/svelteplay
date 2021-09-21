<script lang="ts">
	import Header from '$lib/header/index.svelte';
	import Footer from '$lib/footer/index.svelte';
	import '../app.postcss';
</script>

<div class="flex flex-col min-h-screen">
<Header />

<main class="p-2.5 mt-4 md:p-8 w-full max-w-screen-lg mx-auto box-border flex-1">
	<slot />
</main>

<Footer />
</div>


