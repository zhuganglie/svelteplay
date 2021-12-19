
import remarkGfm  from 'remark-gfm';
import emoji from 'remark-emoji';

const config = {
  extensions: [".svelte.md", ".md", ".svx"],

  layout: {
		"blog": "./src/lib/templates/post.svelte",
		"slides": "./src/lib/templates/slide.svelte",
	},

  smartypants: {
    "dashes": "oldschool"
  },

  remarkPlugins: [emoji, remarkGfm],
  rehypePlugins: [],
};

export default config;
