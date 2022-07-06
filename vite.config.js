// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import Unocss from 'unocss/vite';
import transformerDirective from '@unocss/transformer-directives'
import { presetUno, presetIcons } from 'unocss';
import { extractorSvelte } from '@unocss/core';

/** @type {import('vite').UserConfig} */
const config = {
        server: {
        fs: {
            allow: ['..'],
        },
    },
        plugins: [
            sveltekit(),
            Unocss({ 
                transformers: [
                    transformerDirective(),
                  ],
                extractors: [extractorSvelte],
                presets: [presetIcons({}), presetUno()],
                rules:[],
            }),
        ]
};

export default config;