<script>
    import {formatDate} from "../../lib/date";
    import talks from "$lib/data/talks.json";
    </script>

    <svelte:head>
        <title>Talks</title>
    </svelte:head>

        <h1 class="text-3xl">报 告</h1>
        <hr />
    
        {#each talks as talk}
        {#if formatDate(talk.date)}
        <div class="md:flex md:items-center md:space-y-6 mb-6">
            <div class="">
                <img src={talk.image} alt="talk1" loading="lazy" class="w-1/2 md:w-1/4 my-4 mx-auto" />
            </div>
            <div class="w-full md:w-11/12 m-0">
            <h2 class="text-xl">{talk.title}</h2>
            <p>{talk.description}</p>
            <a href={talk.slide} target="_blank" class="rounded w-max px-2.5 py-1 bg-zinc-700 text-yellow-500 text-sm flex items-center space-x-2">
                <span>详 情</span><div class="i-mdi-presentation" />
            </a>
            </div>
        </div>
        <hr />
        {/if}
        {/each}