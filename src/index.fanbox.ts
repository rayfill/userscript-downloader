import { hookXMLHttpRequest } from './lib/hooks.js';
import { startCollector, getPostInfo, getPostId } from './fanbox/collector.js';
import { drawInfoArea } from './lib/ui.js';

async function main() {
  try {
    hookXMLHttpRequest();
    startCollector();
    window.addEventListener('DOMContentLoaded', () => {
      const [container, button] = drawInfoArea(() => console.log('clicked'));
    });
  } catch (e) {
    console.error(e);
  }
}

main();
