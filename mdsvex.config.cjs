
module.exports = {
	extensions: [".svelte.md", ".md", ".svx"],
	layout: {
		blog: './src/lib/templates/post.svelte',
		slides: './src/lib/templates/slide.svelte',
	},
	smartypants: {
		dashes: "oldschool",
	},
	remarkPlugins: [],
	rehypePlugins: [],
};
