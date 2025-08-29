import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'unplugin-dts/vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => ({
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['es', 'umd'],
			name: pkg.name,
		},
		sourcemap: true,
		rollupOptions: {
			input: {
				index: 'src/index.ts',
				...(mode === 'development' && { demo: 'demo/index.html' }),
			},
		},
	},
	plugins: [tsconfigPaths(), dts({ bundleTypes: true })],
}));
