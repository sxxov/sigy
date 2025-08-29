import { mergeConfig } from 'vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import config from './vite.config';

export default defineConfig((env) =>
	mergeConfig(config(env), {
		test: {
			include: ['**/{*.,}{test,spec}.ts'],
			name: 'unit',
			environment: 'node',
		},
	} satisfies ViteUserConfig),
);
