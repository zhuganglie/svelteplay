<script lang="ts">
	import Header from '$lib/Header/index.svelte';
	import Footer from '$lib/Footer/index.svelte';
	import '../app.css';
</script>

<section class="flex-col justify-between items-center h-screen">
<Header />

<main class="p-2 md:p-8 w-full max-w-screen-lg  mb-auto box-border h-auto overflow-y-auto">
	<slot />
</main>

<Footer />
</section>


