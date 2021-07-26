<script>
    import {formatDate} from "../../lib/date";
    import {notes} from "../../lib/notes";
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
        <div class=" md:flex md:space-x-4 md:space-y-4 md:justify-center md: items-center">
            <img src={note.image} alt="talk1" loading="lazy" class="w-full md:w-1/4 block ml-auto mr-auto mb-4" />
            <div class="w-full md:w-3/4">
            <h4>{note.title}</h4>
            <p>{note.description}</p>
            <a href={note.slide} target="_blank" class="rounded w-max px-2.5 py-1 bg-gray-100 text-red-900 text-sm flex items-center space-x-2"><span>下载</span><FilePdfOutline {size} />
            </a>
            </div>
        </div>
        {/if}
        {/each}