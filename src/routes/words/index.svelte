<script lang="ts">
import Words from '$lib/data/words.json'
import { Splide, SplideSlide } from '@splidejs/svelte-splide';
  import type { Options } from '@splidejs/splide';
  import '@splidejs/splide/dist/css/splide.min.css';
  const options: Options = {
    rewind : true,
    autoplay: true,
    perPage: 1,
    gap    : '1rem',
    height : '30rem',
    cover: false,
    mediaQuery: 'max',
    breakpoints: {
      1000: {
        height: '25rem',
      },
    },
  }
    </script>

<h2>词汇记忆</h2>
<hr />

  <Splide options={options}>
 <SplideSlide>One</SplideSlide>
 <SplideSlide>Two</SplideSlide>
  </Splide>