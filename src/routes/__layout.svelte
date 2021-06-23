<script lang="ts">
	import Header from '$lib/Header/index.svelte';
	import Footer from '$lib/Footer/index.svelte';
	import '../app.css';
</script>

<section class="flex-col h-screen">
<Header />

<main class="flex-col justify-center items-center p-2 md:p-8 h-full w-full max-w-screen-lg  mb-auto  mx-auto box-border flex-1 overflow-y-auto no-scrollbar">
	<slot />
</main>

<Footer />
</section>


<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>