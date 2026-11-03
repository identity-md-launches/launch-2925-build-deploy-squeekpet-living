import type { Coat } from './game';

export const palette = { honey: ['#d3a05f','#edc88f','#fff1d4'], snow: ['#a8aaa3','#e2e3d9','#fffdf0'], cocoa: ['#795b4a','#ad8269','#eed1ac'] };
// Original 32-unit pixel sprite shared by the room, runner and exported card.
export function petSvgInner(coat: Coat = 'honey', stage = 0, sleeping = false) {
  const [dark,fur,cream] = palette[coat];
  return `<g shape-rendering="crispEdges">
  <path fill="#6c533e" d="M5 10h2V7h6v2h2v4h3V9h2V7h6v3h2v7h-2v2h2v4h2v8h-2v3h-3v2H7v-2H4v-3H2v-8h2v-4h2v-2H5z"/>
  <path fill="${fur}" d="M7 11h2V9h3v2h1v5h7v-5h2V9h3v2h1v6h-3v3h3v4h2v6h-2v3h-4v1H9v-1H6v-3H4v-6h2v-4h3v-3H7z"/>
  <path fill="#e5a395" d="M8 11h4v4H8zM21 11h4v4h-4z"/>
  <path fill="${dark}" d="M6 21h3v7H7v3h3v2H7v-2H5v-6h1zM23 21h3v4h2v5h-2v3h-3v-2h2v-3h-2z"/>
  <path fill="${cream}" d="M12 18h8v2h3v4h2v6h-3v3H10v-3H8v-6h2v-4h2z"/>
  <path fill="${fur}" d="M11 17h10v5h-4v1h-3v-1h-3z"/>
  ${sleeping ? '<path fill="#493c33" d="M9 19h4v2H9zM20 19h4v2h-4z"/>' : '<path fill="#493c33" d="M9 17h4v5H9zM20 17h4v5h-4z"/><path fill="#fffdf0" d="M9 17h2v2H9zM20 17h2v2h-2z"/>'}
  <path fill="#e8a28d" d="M6 22h5v3H6zM22 22h5v3h-5zM15 23h3v2h-3z"/>
  <path fill="#6c533e" d="M16 25h1v2h2v1h-3v-1h-2v-1h2z"/>
  <path fill="#e5b78d" d="M6 33h6v3H6zM21 33h6v3h-6z"/>
  <path fill="${fur}" d="M5 27h5v3H5zM23 27h5v3h-5z"/>
  ${stage >= 1 ? '<path fill="#49744b" d="M15 6h2v7h-2z"/><path fill="#78a35d" d="M10 3h5v5h-5zM17 3h5v5h-5zM13 0h6v5h-6z"/>' : ''}
  ${stage >= 2 ? '<path fill="#526e9c" d="M6 29h21v3H6zM23 31h4v6h-4z"/><path fill="#f7d886" d="M14 29h3v3h-3zM24 34h2v2h-2z"/>' : ''}
  </g>`;
}
export function petSvg(coat: Coat = 'honey', stage = 0, sleeping = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="190" viewBox="0 0 32 38">${petSvgInner(coat,stage,sleeping)}</svg>`;
}
export function spriteImage(coat: Coat, stage: number): Promise<HTMLImageElement> {
  return new Promise((resolve,reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Pet artwork could not be rendered.'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(petSvg(coat,stage))}`;
  });
}
