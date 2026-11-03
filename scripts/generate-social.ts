import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Habitat } from '../src/components/Habitat';

const nunito=(await readFile('public/fonts/nunito.woff2')).toString('base64');
const pixel=(await readFile('public/fonts/pixel.woff2')).toString('base64');
const room=renderToStaticMarkup(createElement(Habitat,{pet:null,night:false,active:false,action:null,paused:true,onPet:()=>{}}));
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Nunito;src:url(data:font/woff2;base64,${nunito});font-weight:400 700}
    @font-face{font-family:Pixel;src:url(data:font/woff2;base64,${pixel});font-weight:400 700}
    *{box-sizing:border-box}body{margin:0;background:#f7f7ed;color:#354631;font-family:Nunito,sans-serif}
    .social{height:630px;position:relative;overflow:hidden;padding:72px 64px;border:16px solid #e5ecd9}
    .copy{position:relative;z-index:3;width:460px}.logo{font:600 68px Pixel;margin:0 0 13px}.edition{font:400 20px Nunito;color:#5c684f}
    h1{font:600 46px/1.2 Pixel;margin:68px 0 18px;max-width:420px}p{font:400 21px/1.7 Nunito;max-width:390px;color:#5c684f}.play{font:700 17px Nunito;background:#4f6c43;color:#fffef5;display:inline-block;padding:14px 22px;border-radius:10px;margin-top:10px}
    .habitat{position:absolute;width:790px;left:525px;top:112px;border:8px solid #bdcba8;border-radius:16px;overflow:hidden;transform:rotate(-3deg)}.room-caption{display:none}.scene{position:relative;aspect-ratio:800/460}.room-art{width:100%;display:block}.pet-position{position:absolute;left:43%;top:53%;width:16%;height:34%}.pet-touch{width:100%;height:100%;padding:0;border:0;background:none}.pet-sprite{width:100%;height:100%}.pet-shadow{position:absolute;bottom:4%;left:9%;width:82%;height:9%;background:#63734933}.leaf{position:absolute;right:54px;top:38px;font:600 40px Pixel;color:#8fa578}
  </style></head><body><div class="social"><div class="copy"><div class="logo">SqueekPet</div><div class="edition">Living Evolution</div><h1>Home, sweet hamster.</h1><p>A cozy little life, connected to one real hamster.</p><div class="play">Adopt. Care. Grow together.</div></div>${room}<span class="leaf">✦</span></div></body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'public/social.png'});
  process.stdout.write('Generated public/social.png (1200 × 630) from the original habitat artwork.\n');
}finally{await browser.close();}
