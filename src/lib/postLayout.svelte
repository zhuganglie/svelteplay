<script>
	import {formatDate} from './date';
	export let title;
	export let date;
	
    let dateDisplay = formatDate(date);
	
</script>

<svelte:head>
	<title>{title} - Jökull Sólberg</title>
</svelte:head>

<div class="prose prose-sm sm:prose page max-w-none sm:max-w-none">
	<div class="py-8 sm:py-10 sm:text-center">
		<div class="font-bold text-4xl mb-4">{title}</div>
		<div class="text-sm">{dateDisplay}</div>
		
	</div>
	
	<slot />
</div>