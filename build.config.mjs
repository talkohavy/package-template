import { execSync } from 'child_process';
import { build } from 'esbuild';
import fs, { cpSync } from 'fs';
import path from 'path';

/**
 * @typedef {{
 *   version: string,
 *   private?: string | boolean,
 *   main: string,
 *   type: 'module' | 'commonjs'
 *   types: string,
 *   scripts?: Record<string, string>,
 *   publishConfig: {
 *     access: string
 *   },
 *   devDependencies?: Record<string, string>,
 * }} PackageJson
 */

const ROOT_PROJECT = process.cwd();
const mode = process.env.NODE_ENV;
const isProd = mode === 'production';
const outDirName = 'dist';
const COLORS = {
  green: '[32m',
  blue: '[34m',
  stop: '[39m',
};

buildPackageConfig();

async function buildPackageConfig() {
  cleanDistDirectory();

  await runBuild();

  copyStaticFiles();

  manipulatePackageJsonFile();

  console.log('DONE !!!');
}

function cleanDistDirectory() {
  console.log(`${COLORS.green}- Step 1:${COLORS.stop} clear the ${outDirName} directory`);
  execSync(`rm -rf ${outDirName}`);
}

async function runBuild() {
  console.log(`${COLORS.green}- Step 2:${COLORS.stop} build the output dir`);

  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: `${outDirName}/index.js`,
    sourcemap: !isProd, // <--- defaults to `false`. for 'node', create sourcemaps is for development only.
    minify: isProd, // <--- defaults to `false`. should be `true` only in production.
    platform: 'node', // <--- defaults to 'browser'. If you're creating a CLI tool, use 'node' value. Setting platform to 'node' is beneficial when for example, all packages that are built-in to node such as fs are automatically marked as external so esbuild doesn't try to bundle them.
    format: 'esm', // <--- When platform is set to 'node', this defaults to 'cjs'.
    tsconfig: 'tsconfig.json', // <--- Normally the build API automatically discovers tsconfig.json files and reads their contents during a build. However, you can also configure a custom tsconfig.json file to use instead. This can be useful if you need to do multiple builds of the same code with different settings.
    treeShaking: true, // <--- defaults to `true`. Removes dead code.
    mainFields: ['main', 'module'], // <--- When platform is set to 'node', this defaults to 'module','main'. When platform is set to 'browser', this defaults to 'browser','module','main'. IMPORTANT! The order matters! 'main', 'module' is not the same as 'module', 'main'! I chose the more risky one, that attempts to tree-shake, but could potentially fail.
    packages: 'external', // <--- You also may not want to bundle your dependencies with esbuild. There are many node-specific features that esbuild doesn't support while bundling such as __dirname, import.meta.url, fs.readFileSync, and *.node native binary modules. You can exclude all of your dependencies from the bundle by setting packages to external. If you do this, your dependencies must still be present on the file system at run-time since they are no longer included in the bundle.
    conditions: [], // <--- If no custom conditions are configured, the Webpack-specific module condition is also included. The module condition is used by package authors to provide a tree-shakable ESM alternative to a CommonJS file without creating a dual package hazard. You can prevent the module condition from being included by explicitly configuring some custom conditions (even an empty list).
    /**
     * Some npm packages you want to use may not be designed to be run in the browser.
     * Sometimes you can use esbuild's configuration options to work around certain issues and successfully
     * bundle the package anyway. Undefined globals can be replaced with either the define feature in
     * simple cases or the inject feature in more complex cases.
     */
    // define :
    // inject :
  });
}

function copyStaticFiles() {
  console.log(`${COLORS.green}- Step 3:${COLORS.stop} copy static files`);

  const filesToCopyArr = [
    { filename: 'package.json', sourceDirPath: [], destinationDirPath: [] },
    { filename: '.npmignore', sourceDirPath: [], destinationDirPath: [] },
    {
      filename: '.npmrc',
      sourceDirPath: [],
      destinationDirPath: [],
      isAllowedToFail: true,
    },
    { filename: 'README.md', sourceDirPath: [], destinationDirPath: [] },
  ];

  filesToCopyArr.forEach(({ filename, sourceDirPath, destinationDirPath, isAllowedToFail }) => {
    try {
      const sourceFileFullPath = path.resolve(ROOT_PROJECT, ...sourceDirPath, filename);
      const destinationFileFullPath = path.resolve(ROOT_PROJECT, outDirName, ...destinationDirPath, filename);

      cpSync(sourceFileFullPath, destinationFileFullPath);
      console.log(`    • ${filename}`);
    } catch (error) {
      console.error(error);
      if (isAllowedToFail) return;

      throw new Error('File MUST exists in order to PASS build process! cp operation failed...');
    }
  });
}

function manipulatePackageJsonFile() {
  console.log(`${COLORS.green}- Step 4:${COLORS.stop} copy & manipulate the package.json file`);

  const packageJsonPath = path.resolve(ROOT_PROJECT, outDirName, 'package.json');

  // Step: get the original package.json file
  /** @type {PackageJson} */
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

  delete packageJson.private;
  delete packageJson.scripts;
  delete packageJson.devDependencies;
  packageJson.publishConfig.access = 'public';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

  console.log(`  • ${COLORS.blue}changed${COLORS.stop} from private to public`);
  console.log(`  • ${COLORS.blue}deleted${COLORS.stop} "scripts" key`);
  console.log(`  • ${COLORS.blue}deleted${COLORS.stop} "devDependencies" key`);
  console.log(`  • ${COLORS.blue}changed${COLORS.stop} publishConfig access to public`);
  console.log(`  • ${COLORS.blue}package.json${COLORS.stop} file written successfully!`);
}
