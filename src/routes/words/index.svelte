<script lang="ts">
import Words from '$lib/data/words.json'
import { Splide, SplideSlide } from '@splidejs/svelte-splide';
import type { Options } from '@splidejs/splide';
import '@splidejs/splide/dist/css/splide.min.css';

  const options: Options = {
    rewind : true,
    autoplay: true,
    perPage: 1,
    //direction: 'ttb',
    gap    : '1rem',
    height : '30rem',
    cover: false,
    mediaQuery: 'max',
    breakpoints: {
      1024: {
        height: '35rem',
        perpage: 1,
      },
    },
  }
    </script>

<h2>词汇记忆</h2>
<hr />

  <Splide options={options}>
    {#each Words as word}
 <SplideSlide>
   <div class="h-full w-5/6 grid place-content-center m-auto">
    <details>
      <summary class="text-3xl mb-6">{word.word}</summary>
      <div class="flex space-x-8">
        {#each word.content as item}
        <div class="">
        <p>读音：{item.pronunciation}</p>
        <p>词性：{item.property}</p>
        <p>解释：{item.meaning}</p>
        <p>例句：{item.example}</p>
        </div>
        {/each}
        </div>
        <p>近义词：{#each word.synonym as item}<span class="mr-2">{item}</span>{/each}</p>
        <p>看图：</p>
          <p>视频：</p>
          <p>音频：</p>
    </details>
 </SplideSlide>
 {/each}
  </Splide>