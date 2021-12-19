<script context="module">
	export const prerender = true;
</script>

<script>
	export let title
</script>

<div class="font-bold text-2xl sm:text-3xl mb-4">{title}
</div>
<slot />