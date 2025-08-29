import { describe, it, expect } from 'vitest';
import * as api from './index';

describe('public api', () => {
	it('re-exports core symbols', () => {
		expect(typeof api.Signal).toBe('function');
		expect(typeof api.derive).toBe('function');
		expect(typeof api.subscribe).toBe('function');
		expect(typeof api.bin).toBe('function');
	});
});
