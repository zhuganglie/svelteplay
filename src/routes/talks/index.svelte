<script>
    import {formatDate} from "../../lib/date";
    import talks from "$lib/data/talks.json";
    import FilePdfOutline from "svelte-material-icons/FilePdfOutline.svelte";

    export let size = "1.15em";
    </script>

    <svelte:head>
        <title>Talks</title>
    </svelte:head>

        <h2>报 告</h2>
        <hr />
    
        {#each talks as talk}
        {#if formatDate(talk.date)}
        <div class="md:flex md:items-center md:space-y-6 mb-6">
            <div class="">
                <img src={talk.image} alt="talk1" loading="lazy" class="w-1/2 md:w-1/4 my-4 mx-auto" />
            </div>
            <div class="w-full md:w-11/12 m-0">
            <h4>{talk.title}</h4>
            <p>{talk.description}</p>
            <a href={talk.slide} target="_blank" class="rounded w-max px-2.5 py-1 bg-gray-700 text-gray-300 hover:text-gray-100 focus:text-gray-100 text-sm flex items-center space-x-2">
                <span>详 情</span><FilePdfOutline {size} />
            </a>
            </div>
        </div>
        <hr />
        {/if}
        {/each}