import { mdsvex } from "mdsvex";
import mdsvexConfig from "./mdsvex.config.js";
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';
import Unocss from 'unocss/vite';
import transformerDirective from '@unocss/transformer-directives'
import { presetUno, presetIcons } from 'unocss';
import { extractorSvelte } from '@unocss/core';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ...mdsvexConfig.extensions],
	preprocess: [
		mdsvex(mdsvexConfig),
		preprocess()],

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: adapter(),
		vite: {
			plugins: [
				Unocss({ 
					transformers: [
						transformerDirective(),
					  ],
					extractors: [extractorSvelte],
					presets: [presetIcons({}), presetUno()],
					rules:[],
				})
			  ],
			server: {
				fs: {
					allow: ['..'],
				},
			}
		}
	}
};

export default config;
