<script lang="ts">
	import Header from '$lib/Header/index.svelte';
	import Footer from '$lib/Footer/index.svelte';
	import '../app.css';
</script>

<section class="flex-col h-screen">
<Header />

<main class="flex-col p-2 md:p-8 w-full h-full max-w-screen-lg  mb-auto box-border flex-1 overflow-y-auto">
	<slot />
</main>

<Footer />
</section>


