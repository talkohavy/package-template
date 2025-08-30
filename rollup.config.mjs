import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

/**
 * @type {import('rollup').RollupOptions}
 */

export default {
  input: 'src/index.ts',
  logLevel: 'debug',
  treeshake: true, // <--- default to true
  output: [
    {
      file: 'dist/index.cjs.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.mjs',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [typescript(), terser()],
};
