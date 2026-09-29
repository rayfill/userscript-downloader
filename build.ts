import { doBuild, doWatch, type DoBuildOptions } from './build-base.js';

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
    },
    {
      input: 'src/index.twitter.ts',
      output: 'twitter.user',
      headerPath: 'headers/twitter.headers.txt',
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
