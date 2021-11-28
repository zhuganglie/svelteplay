<script context="module">
    // export const prerender = true
    export async function load({ fetch, page: { params } }) {
      const { slug } = params
      const res = await fetch(`/notes/${slug}.json`)
      if (res.ok) {
        const { note } = await res.json()
        return {
          props: { note },
        }
      }
    }
  </script>
  
  <script lang='ts'>
    import {formatDate} from '$lib/date';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    
    export let note
    export let size = "1em";
    
    let { html, date, title, book, publisher, year, authors, category } = note
    let dateDisplay = formatDate(date);
  </script>

  
  <article class="flex flex-col flex-grow">
    <h2>{title}</h2>
    <div class="">
        <div class="flex flax-wrap pl-4 justify-start items-center space-x-1"><Calendar {size} /> <span>{dateDisplay}</span></div>
      <hr />
      <ul>
          <li>书名：{book}</li>
          <li><div class="flex flex-wrap space-x-2">作者：{#each authors as author}<span>{author}｜</span>{/each}</div></li>
          <li>出版社：{publisher}</li>
          <li>出版时间：{year} 年</li>
          <li>分类：{category}</li>
          </ul>
      <hr />
      <article>
        {@html html}
      </article>
    </div>
  </article>