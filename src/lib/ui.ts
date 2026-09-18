type HandlerType = () => void;
export function drawInfoArea(handle: HandlerType) {

  const container = document.createElement('div');
  container.id = 'fanbox-downloader';
  container.style.position = 'fixed';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.flexDirection = 'row-reverse';
  container.style.width = '90vw';
  container.style.bottom = '40px';

  const button = document.createElement('button');
  button.onclick = handle;
  button.value = 'download';
  button.innerText = 'download';
  button.style.backgroundColor = 'lightgray';

  container.appendChild(button);
  window.document.body.appendChild(container);

  return [container, button] as const;
}
