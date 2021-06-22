<script lang="ts">
	import Header from '$lib/Header/index.svelte';
	import Footer from '$lib/Footer/index.svelte';
	import '../app.css';
</script>

<Header />

<main class="flex-col flex-1 p-2 md:p-8 w-full max-w-screen-lg h-screen  m-auto box-border overflow-y-auto">
	<slot />
</main>

<Footer />

