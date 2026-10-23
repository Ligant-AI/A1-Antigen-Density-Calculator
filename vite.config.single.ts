import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { staticBlock } from './vite.config';
export default defineConfig({
    plugins: [react(), staticBlock(), viteSingleFile()],
    build: { outDir: 'dist-single', assetsInlineLimit: 100000000, cssCodeSplit: false },
});
