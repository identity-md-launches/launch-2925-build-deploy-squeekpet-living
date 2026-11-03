import { useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { achievements, levelOf, stageOf, STAGES, type Pet } from '../game';
import { spriteImage } from '../art';

export async function renderCard(pet: Pet) {
  const canvas = document.createElement('canvas'); canvas.width=900; canvas.height=1100;
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('PNG export is unavailable in this browser.');
  await document.fonts.ready;
  const image=await spriteImage(pet.coat,stageOf(pet));
  ctx.fillStyle='#f7f5e7';ctx.fillRect(0,0,900,1100);
  ctx.fillStyle='#9daf83';ctx.fillRect(24,24,852,1052);ctx.fillStyle='#f7f5e7';ctx.fillRect(30,30,840,1040);
  ctx.fillStyle='#3c5139';ctx.font='600 52px "Pixelify Sans",sans-serif';ctx.textAlign='center';ctx.fillText('SqueekPet',450,110);
  ctx.font='400 20px Nunito,sans-serif';ctx.fillStyle='#66715a';ctx.fillText('A little friend. A living world.',450,150);
  ctx.fillStyle='#e3e8d1';ctx.fillRect(105,190,690,430);
  ctx.fillStyle='#ced9b7';for(let x=120;x<790;x+=44)for(let y=210;y<600;y+=44){ctx.fillRect(x,y,4,4);}
  ctx.fillStyle='#bfcca6';ctx.fillRect(270,550,360,25);ctx.fillRect(250,555,400,15);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,310,245,280,332);
  ctx.fillStyle='#3c5139';ctx.font='600 48px "Pixelify Sans",sans-serif';ctx.fillText(pet.name,450,700,730);
  ctx.font='600 24px Nunito,sans-serif';ctx.fillText(`Level ${levelOf(pet)} · ${STAGES[stageOf(pet)].name}`,450,748);
  const badges=achievements(pet).slice(0,3);
  ctx.font='400 22px Nunito,sans-serif';ctx.fillStyle='#66715a';
  ctx.fillText(`${pet.memories.length} Wheel ${pet.memories.length===1 ? 'Memory' : 'Memories'} · ${pet.runner.best} personal best`,450,797);
  badges.forEach((b,i)=>{ctx.fillStyle='#e6ead8';ctx.fillRect(170,835+i*47,560,36);ctx.fillStyle='#4a6142';ctx.fillText(b,450,862+i*47);});
  ctx.font='400 18px Nunito,sans-serif';ctx.fillStyle='#66715a';ctx.fillText('A game keepsake. No NFT, tokens or financial value.',450,1030);
  return canvas;
}
export function PetCard({ pet, notify }: { pet: Pet; notify: (m: string) => void }) {
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{let alive=true;renderCard(pet).then(canvas=>{if(alive){setUrl(canvas.toDataURL('image/png'));setError('');}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Card could not be created. Try downloading again.');});return()=>{alive=false;};},[pet.name,pet.coat,pet.xp,pet.memories.length,pet.runner.best,pet.runner.runs,pet.counts.feed,pet.counts.clean]);
  async function download(){setBusy(true);try{const canvas=await renderCard(pet);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG could not be created.')),'image/png'));const object=URL.createObjectURL(blob);const link=document.createElement('a');link.href=object;link.download=`squeekpet-${pet.name.replace(/[^a-z0-9]/gi,'-')}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(object),10000);notify('Your hamster’s PNG card is ready to keep.');setError('');}catch(e){setError(e instanceof Error?e.message:'Could not export the card. Try again.');}finally{setBusy(false);}}
  const share=`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Meet ${pet.name}, my level ${levelOf(pet)} ${STAGES[stageOf(pet)].name} in SqueekPet! A cozy little world connected to a real hamster.`)}&url=${encodeURIComponent(location.href.split('#')[0])}`;
  return <section className="pet-card-section"><h2>A little keepsake</h2><p>Your card grows along with your hamster.</p><div className="card-preview">{url?<img src={url} alt={`${pet.name} pet card: level ${levelOf(pet)}, ${STAGES[stageOf(pet)].name}`} width={900} height={1100}/>:<p>{error || 'Drawing your little keepsake…'}</p>}</div><div className="card-actions"><button className="primary-button" onClick={download} disabled={busy}><Download size={17}/>{busy?'Creating PNG…':'Download PNG'}</button><a className="secondary-button" href={share} target="_blank" rel="noreferrer"><Share2 size={17}/>Share on X</a></div>{error&&<p className="field-error" role="alert">{error}</p>}<p className="fine-print">A downloadable game keepsake. No NFT or financial value.</p></section>;
}
