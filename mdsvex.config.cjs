module.exports = {
	extensions: [".svelte.md", ".md", ".svx"],
	layout: {
		blog: './src/lib/post.svelte',
		slides: './src/lib/slide.svelte',
	},
	smartypants: {
		dashes: "oldschool",
	},
	remarkPlugins: [],
	rehypePlugins: [],
};
