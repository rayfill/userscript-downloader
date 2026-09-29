import { hookXMLHttpRequest, addHook, type HookHandlerType, type LoadArgsType } from './lib/hooks.js';

const hooks = 'https://x.com/i/api/graphql/whgGeEQDhEDkPQEJiJvYQw/HomeTimeline';
async function main() {
  try {
    const hook: HookHandlerType = {
      async load(type, data, url, contentType) {
        
      }
    };
    addHook(hook);
    hookXMLHttpRequest();
  } catch (e) {
    console.error(e);
  }
}

main();
