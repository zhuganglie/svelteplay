
<script>
    //import { page } from '$app/stores';
	import Comments from 'disqus-svelte';
	import {formatDate} from './date';
	import TagOutline from 'svelte-material-icons/TagOutline.svelte';
	import Calendar from 'svelte-material-icons/Calendar.svelte';
	export let title;
	export let date;
	export let tags;
    export let size = "1em";
    
	let dateDisplay = formatDate(date);
    
</script>

<svelte:head>
	<title>{title} - Caesar</title>
</svelte:head>

<div class="prose prose-sm sm:prose page max-w-none sm:max-w-none">
	<div class="py-4 sm:py-6 text-center">
		<div class="font-bold text-3xl sm:text-4xl mb-4">{title}</div>
		<div class="text-sm flex justify-center items-center space-x-1">发表于： <Calendar {size} /> <span>{dateDisplay}</span></div>
		<div class="mt-3 flex justify-center items-center">
			{#each tags as tag}
			  <a sveltekit:prefetch class="flex justify-center items-center space-x-1 rounded-full bg-yellow-100 px-2.5 py-0.5 mx-1.5 text-sm " href="/tags/{tag}"
				><TagOutline {size} /><span>{tag}</span></a
			  >
			{/each}
		  </div>
	</div>
	<hr />
	<slot />
	<hr />
	<a href="/blog/" class="bg-yellow-100 rounded-full px-2.5 py-0.5">&larr; 返回列表</a>

	<Comments identifier="post" />
</div>