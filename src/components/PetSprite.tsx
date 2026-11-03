import type { Coat } from '../game';
import { petSvgInner } from '../art';
export function PetSprite({ coat = 'honey', stage = 0, sleeping = false, className = '' }: { coat?: Coat; stage?: number; sleeping?: boolean; className?: string }) {
  return <svg className={`pet-sprite ${className}`} viewBox="0 0 32 38" aria-hidden="true" dangerouslySetInnerHTML={{ __html: petSvgInner(coat,stage,sleeping) }} />;
}
