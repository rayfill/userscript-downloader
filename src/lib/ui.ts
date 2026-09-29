export type HandlerType = () => void;
export function drawInfoArea(...handles: Array<[(() => string) | string, HandlerType]>) {

  const container = document.createElement('div');
  container.id = 'fanbox-downloader';
  container.style.position = 'fixed';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.width = '90vw';
  container.style.bottom = '40px';

  const buttons = handles.map((handle) => {
    const button = document.createElement('button');
    button.onclick = handle[1];
    button.value = 'download';
    button.innerText = typeof handle[0] === 'string' ? handle[0] : handle[0]();
    button.style.backgroundColor = 'lightgray';
    button.style.margin = '4px';
    button.style.padding = '8px';
    button.style.border = 'black';
    button.style.borderRadius = '5%';
    button.style.color = 'black';
    container.appendChild(button);
    return button;
  });
  window.document.body.appendChild(container);

  return [container, ...buttons] as const;
}
