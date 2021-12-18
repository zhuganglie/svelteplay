//import { createRequire } from "module";
//const require = createRequire(import.meta.url)
//export const mdsvexConfig = require("./mdsvex.config.cjs");
import * as github from "remark-github";

const config = {
  "extensions": [".svelte.md", ".md", ".svx"],

  "layout": {
		"blog": "./src/lib/templates/post.svelte",
		"slides": "./src/lib/templates/slide.svelte",
	},

  "smartypants": {
    "dashes": "oldschool"
  },

  "remarkPlugins": [github],
  "rehypePlugins": [],
};

export default config;
