import { build, context, type BuildOptions, type Plugin } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Temporal } from '@js-temporal/polyfill';

async function doBuild(doBuildOptions: DoBuildOptions) {
  const srcHeader = await readFile(doBuildOptions.headerPath, 'utf-8');
    const header = headerComplete(srcHeader, {
    githubUser: 'rayfill',
    repositoryName: 'userscript-downloader',
    branch: 'main',
    targetPath: `dist/${doBuildOptions.output}.js`
    });

  const options: BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: 'external',
    banner: {
      js: header
    },
    entryPoints: [
      {
        in: doBuildOptions.input,
        out: doBuildOptions.output
      }
    ],
    platform: 'browser',
    target: ['esnext'],
    outdir: 'dist'
  };

  const outPath = join(options.outdir!, `localimport-${doBuildOptions.output}.js`);
  const localImportPath = join(options.outdir!, `${doBuildOptions.output}.js`);

  await mkdir(options.outdir!, { recursive: true });
  await Promise.all([
    build(options),
    writeLocalImportJs(outPath, localImportPath, header.split('\n'))
  ]);
}

const watchLogPlugin: Plugin = {
  name: 'watch build event and logging',
  setup(build) {
    build.onStart(() => {
      console.log(`変更を検出しました。ビルドを開始します`);
    });
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          if (error.location !== null) {
            const location = error.location;
            console.error(`[error] ${location.file}:${location.column} ${error.text}`);
          } else {
            console.error(`[error] ${error.text}`);
          }
        });
      } else {
        console.log(`ビルドが完了しました`);
      }
    });
  }
};

interface HeaderOptions {
  githubUser: string;
  repositoryName: string;
  branch: string;
  targetPath: string;
}
function headerComplete(srcHeader: string, options: HeaderOptions): string {
  const datetime = Temporal.Now.zonedDateTimeISO('Asia/Tokyo');
  const year = String(datetime.year).padStart(4, '0');
  const month = String(datetime.month).padStart(2, '0');
  const day = String(datetime.day).padStart(2, '0');
  const hour = String(datetime.hour).padStart(2, '0');
  const minute = String(datetime.minute).padStart(2, '0');
  const second = String(datetime.second).padStart(2, '0');
  const version = `${year}${month}${day}.${hour}${minute}${second}`;

  const downloadUrl = `https://github.com/${options.githubUser}/${options.repositoryName}/raw/refs/heads/${options.branch}/${options.targetPath}`;

  return srcHeader.replaceAll('{{version}}', version).replaceAll('{{downloadUrl}}', downloadUrl);
}

async function doWatch(doBuildOptions: DoBuildOptions) {
  const srcHeader = await readFile(doBuildOptions.headerPath, 'utf-8');
  const header = headerComplete(srcHeader, {
    githubUser: 'rayfill',
    repositoryName: 'userscript-downloader',
    branch: 'main',
    targetPath: `dist/${doBuildOptions.output}.js`
  });

  const options: BuildOptions = {
    bundle: true,
    minify: false,
    banner: {
      js: header
    },
    entryPoints: [
      {
        in: doBuildOptions.input,
        out: doBuildOptions.output
      }
    ],
    platform: 'browser',
    target: ['esnext'],
    outdir: 'dist'
  };

  const ctx = await context({ ...options, plugins: [watchLogPlugin] });
  return await ctx.watch();
}

async function writeLocalImportJs(outPath: string, importPath: string, headers: Array<string>) {
  const importLine = `// @require      ${pathToFileURL(resolve(importPath))}`;
  const pos = -2;
  headers = headers.map((header) => {
    if (header.search(/@name\W/) >= 0) {
      return header + '(local)';
    }
    return header;
  });
  const importedHeaders = [...headers.slice(0, pos), importLine, ...headers.slice(pos)];
  await writeFile(outPath, importedHeaders.join('\n'), 'utf-8');
}

interface DoBuildOptions {
  input: string;
  output: string;
  headerPath: string;
};

async function main() {
  const args = process.argv.slice(2);
  const mode = (args.length === 1 && args[0] === 'watch') ? 'watch' : 'build';

  const targets: Array<DoBuildOptions> = [
    {
      input: 'src/index.patreon.ts',
      output: 'patreon.user',
      headerPath: 'headers/patreon.headers.txt',
    },
    {
      input: 'src/index.fanbox.ts',
      output: 'fanbox.user',
      headerPath: 'headers/fanbox.headers.txt',
    }
  ];

  try {
    if (mode === 'build') {
      await Promise.all(targets.map((target) => {
        return doBuild(target);
      }));
    } else {
      await Promise.all(targets.map((target) => {
        return doWatch(target);
      }));
      await new Promise(() => {
        console.log('watching...\nyou want cancel, hit C-c');
      });
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
}



main();
