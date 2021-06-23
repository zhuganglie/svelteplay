<script lang="ts">
	import Header from '$lib/Header/index.svelte';
	import Footer from '$lib/Footer/index.svelte';
	import '../app.css';
</script>

<section class="flex-col h-screen w-screen">
<Header />

<main class="flex-col justify-center items-center p-2 md:p-8 h-auto max-w-screen-lg mb-auto  mx-auto box-border flex-1">
	<slot />
</main>

<Footer />
</section>


