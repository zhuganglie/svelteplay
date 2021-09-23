<script>
    import {formatDate} from "../../lib/date";
    import notes from "../../lib/data/notes.json";
    import FilePdfOutline from "svelte-material-icons/FilePdfOutline.svelte";

    export let size = "1.15em";
    </script>

    <svelte:head>
        <title>Notes</title>
    </svelte:head>

        <h2>笔 记</h2>
        <hr />
    
        {#each notes as note}
        {#if formatDate(note.date)}
        <div class="md:flex md:items-center md:space-y-6 mb-6">
            <div class=""><img src={note.image} alt="talk1" loading="lazy" class="w-1/2 md:w-1/4 my-4 mx-auto" /></div>
            <div class="w-full md:w-11/12 m-0">
            <h4>{note.title}</h4>
            <p>{note.description}</p>
            <a href={note.slide} target="_blank" class="rounded w-max px-2.5 py-1 bg-green-900 text-gray-50 hover:text-gray-100 focus:text-gray-100 text-sm flex items-center space-x-2"><span>下载</span><FilePdfOutline {size} />
            </a>
            </div>
        </div>
        <hr />
        {/if}
        {/each}