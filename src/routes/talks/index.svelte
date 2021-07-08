<script>
    import {formatDate} from "../../lib/date";
    import {talks} from "../../lib/talks";
    import FilePdfOutline from "svelte-material-icons/FilePdfOutline.svelte";

    export let size = "1.15em";
    </script>

    <svelte:head>
        <title>Talks</title>
    </svelte:head>

        <h2>演 讲</h2>
        <hr />
    
        {#each talks as talk}
        {#if formatDate(talk.date)}
        <div class=" md:flex md:space-x-4 md:space-y-4 md:justify-center md: items-center">
            <img src={talk.image} alt="talk1" loading="lazy" class="w-full md:w-1/4 block ml-auto mr-auto mb-4" />
            <div class="w-full md:w-3/4">
            <h4>{talk.title}</h4>
            <p>{talk.description}</p>
            <a href={talk.slide} target="_blank" class="rounded w-max px-2.5 py-1 bg-yellow-100 text-red-900 text-sm flex items-center space-x-2"><span>下载</span><FilePdfOutline {size} />
            </a>
            </div>
        </div>
        {/if}
        {/each}