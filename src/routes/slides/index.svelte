<script context="module">
    const allTalks = import.meta.glob("./*.{md,svx}");
    let body = [];
    for(let path in allTalks) {
        body.push(
        allTalks[path]().then(({metadata}) => {
           return {path, metadata};
        })
        ); 
    }
   
    export const load = async() => {
        const talks = await Promise.all(body);
        
        return {
            props: {
                talks,
            },
        };
    };
   </script>
   
   <script lang="ts">
       import {formatDate} from '../../lib/date';
       export let talks;
       const dateSortedTalks = talks.slice().sort((a, b) => {
           return Date.parse(b.metadata.date) - Date.parse(a.metadata.date);
       });  
   </script>
   
   <svelte:head>
       <title>Slides</title>
   </svelte:head>
   
   <h2>谈 话</h2>
   <hr />
   
   {#each dateSortedTalks as {path, metadata: {title, date, draft}}}
   {#if !draft}
       <div class=" mb-4">
          <span class="text-sm border-b border-gray-300 px-2 py-0.5 mb-3 min-w-max"> {formatDate(date)}</span> <br /> <br />
       <a href={`/slides/${path.replace(".md", "").replace(".svx", "")}`} class="text-md text-yellow-500 hover:text-yellow-300 text-left font-semibold mb-2">{title}</a>
         </div>
       <hr />
       {/if}
   {/each}
   
   