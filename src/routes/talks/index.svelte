<script>
    import {formatDate} from "../../lib/date";
    import {talks} from "../../lib/talks";
    </script>
    
        <h1>Talks</h1>
        <hr />
    
        {#each talks as talk}
        {#if formatDate(talk.date)}
        <div class="md:px-10 md:flex md:space-x-4 md:space-y-4 md:justify-center md: items-center">
            <img src={talk.image} alt="talk1" loading="lazy" class="w-full md:w-1/4 block ml-auto mr-auto mb-4" />
            <div>
            <h4>{talk.title}</h4>
            <p>{talk.description}</p>
            <a href={talk.slide} target="_blank" class="flex items-center w-max px-2 ">下载 PDF</a>
            </div>
        </div>
        {/if}
        {/each}