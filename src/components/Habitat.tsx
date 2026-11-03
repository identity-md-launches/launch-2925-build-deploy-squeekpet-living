import { Moon, Sun, Sparkles } from 'lucide-react';
import { stageOf, type Action, type Pet } from '../game';
import { PetSprite } from './PetSprite';

export function Habitat({ pet, night, active, action, paused, onPet }: { pet: Pet | null; night: boolean; active: boolean; action: Action | null; paused: boolean; onPet: () => void }) {
  const equipped = pet?.equipped ?? [];
  const sleeping = !!pet?.sleeping;
  return <div className={`habitat ${night ? 'night' : ''} ${active ? 'world-active' : ''} ${paused ? 'motion-paused' : ''}`}>
    <div className="room-caption"><span><span className="tiny-dot" /> Your cozy corner</span><span>{night ? <Moon size={14} /> : <Sun size={14} />}{night ? 'Moonlit evening' : 'A little sunshine'}</span></div>
    <div className="scene">
      <svg className="room-art" viewBox="0 0 800 460" role="img" aria-label="A cozy pixel-art bedroom with a patchwork bed, a garden window, wooden floor, toys and an exercise wheel" shapeRendering="crispEdges">
        <defs>
          <pattern id="wallpaper" width="44" height="40" patternUnits="userSpaceOnUse"><rect width="44" height="40" fill={night ? '#9cae9c' : '#e5e9cc'} /><path d="M21 17h2v6h-2zM19 19h6v2h-6z" fill={night ? '#91a28f' : '#cbd6b0'} /></pattern>
          <pattern id="floor" width="160" height="36" patternUnits="userSpaceOnUse"><rect width="160" height="36" fill={night ? '#9c876c' : '#dbbf92'} /><path d="M0 0h160v2H0zM0 2h2v34H0zM8 31h49v1H8zM104 9h38v1h-38z" fill={night ? '#8b775d' : '#c6aa7e'} /></pattern>
          <pattern id="rugcheck" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill={equipped.includes('rug') ? '#d2a4a0' : '#b5c69c'} /><path d="M0 0h18v18H0zM18 18h18v18H18z" fill={equipped.includes('rug') ? '#dfbcad' : '#cbd6b2'} /></pattern>
        </defs>
        <rect width="800" height="460" fill="url(#wallpaper)" />
        <path d="M0 0h22v278H0zM778 0h22v278h-22z" fill={night ? '#82947f' : '#c9d5b0'} />
        <path d="M22 0h756v10H22zM22 10h756v4H22z" fill={night ? '#b0b799' : '#eff0d7'} />
        <rect y="282" width="800" height="178" fill="url(#floor)" />
        <path d="M0 271h800v7H0z" fill="#8d916c" /><path d="M0 278h800v8H0z" fill="#b8b38c" /><path d="M0 286h800v5H0z" fill="#eddbb3" />
        {/* Window, distant hills and little garden. */}
        <path d="M301 42h208v7h8v159h-8v8H301v-8h-8V49h8z" fill="#8d815c" />
        <rect x="303" y="50" width="204" height="155" fill={night ? '#3c5368' : '#bcded1'} />
        {night ? <><path d="M447 67h17v8h-8v17h-18V75h9z" fill="#f5e8b3" /><path d="M331 69h4v4h-4zM389 87h3v3h-3zM483 110h4v4h-4zM365 57h3v3h-3z" fill="#e7e5c4" /></> : <><path d="M440 64h23v6h7v22h-7v7h-23v-7h-7V70h7z" fill="#f5e5aa" /><g className="window-cloud"><path d="M315 93h15v-7h24v6h13v7h13v9h-65zM398 121h12v-5h20v5h15v8h-47z" fill="#f5f5df" /></g></>}
        <path d="M303 169h25v-14h24v-10h25v12h19v10h29v-18h21v-12h23v16h17v14h21v39H303z" fill={night ? '#526f69' : '#99b99a'} />
        <path d="M303 185h33v-10h40v9h27v-12h32v10h35v-11h37v35H303z" fill={night ? '#48605b' : '#7b9e75'} />
        <path d="M312 184h6v-15h6v-10h5v10h6v15h5v7h-28zM467 189h5v-13h6v-15h5v15h6v13h5v6h-27z" fill={night ? '#354d4a' : '#6b8f64'} />
        <path d="M397 50h8v155h-8zM303 123h204v7H303z" fill="#efe8c6" />
        <path d="M295 206h220v9H295zM288 215h234v8H288z" fill="#b9a47a" /><path d="M288 215h234v3H288z" fill="#f0dcaf" />
        {/* Linen curtains. */}
        <path d="M283 43h25v22h-4v32h-5v38h-7v36h-9zM499 43h26v128h-10v-36h-7V97h-5V65h-4z" fill={night ? '#bbc3ac' : '#f6efd3'} />
        <path d="M288 48h5v95h-5zM514 48h5v95h-5z" fill={night ? '#a6b39b' : '#e4d9b6'} />
        {/* Shelf with books, a flower pot and a framed little leaf. */}
        <path d="M57 108h175v9H57zM67 117h8v15h-8zM214 117h8v15h-8z" fill="#9f8962" /><rect x="57" y="106" width="175" height="4" fill="#d7bd91" />
        <path d="M73 79h12v27H73zM87 73h14v33H87zM104 83h10v23h-10z" fill="#8b9a6b" /><path d="M73 84h12v3H73zM88 79h12v3H88zM104 88h10v2h-10z" fill="#e7d4ac" />
        <path d="M120 58h38v48h-38z" fill="#a48c67" /><path d="M124 62h30v40h-30z" fill="#f1e5c5" /><path d="M138 75h3v21h-3zM129 71h8v9h-8zM141 79h8v10h-8z" fill="#8aa36d" />
        <path d="M180 81h22v23h-22zM176 80h30v5h-30z" fill="#c19877" /><path d="M190 57h4v25h-4zM179 59h11v13h-11zM194 48h11v17h-11z" fill="#658451" /><path d="M183 57h8v8h-8zM196 47h8v8h-8z" fill="#92ab74" />
        {/* Tiny wall print and hanging vine. */}
        <path d="M579 65h58v69h-58z" fill="#b29973" /><path d="M584 70h48v59h-48z" fill="#f3e9c9" /><path d="M604 88h6v-8h5v8h6v19h-5v8h-15v-8h-5V92h8z" fill="#aab67d" /><path d="M604 113h14v4h-14z" fill="#c4ab72" />
        <path d="M746 0h5v55h-5v16h-5v36h-5v34h-5v18h-4v-26h4v-34h5V65h5V38h5z" fill="#6e8c58" />
        {[13,40,70,100,129].map((y,i) => <path key={y} d={`M${i < 2 ? 733 : 721} ${y}h13v8h-5v5h-8zM${i < 2 ? 749 : 737} ${y+10}h13v9h-5v5h-8z`} fill={i % 2 ? '#8ea96f' : '#72945d'} />)}
        {/* Bed and patchwork quilt. */}
        <path d="M38 215h12v99H38zM49 228h169v62H49zM214 248h12v81h-12zM50 301h165v14H50zM54 315h10v15H54zM198 315h10v15h-10z" fill="#9d805a" />
        <path d="M48 226h164v13H48zM51 239h159v50H51z" fill="#eae3c5" /><path d="M60 231h49v6h8v23H59z" fill="#faf2d9" /><path d="M62 258h51v7H62z" fill="#c7c6a7" />
        <path d="M108 240h105v59H108zM73 268h35v31H73z" fill="#9eb48c" /><path d="M110 243h31v25h-31zM177 268h34v27h-34zM75 269h33v25H75z" fill="#c2cfa4" /><path d="M143 268h31v27h-31zM176 243h35v22h-35z" fill="#849e76" /><path d="M111 272h28v20h-28z" fill="#d0d7ad" /><path d="M124 246h3v16h-3zM117 252h17v3h-17zM186 280h15v3h-15zM192 274h3v15h-3z" fill="#e4e3bd" />
        {/* Bedside table. */}
        <path d="M238 249h52v9h-52zM243 258h42v38h-42zM245 296h6v22h-6zM277 296h6v22h-6z" fill="#af936a" /><path d="M247 263h34v21h-34z" fill="#cfb38b" /><rect x="261" y="272" width="8" height="4" fill="#8c7854" />
        {equipped.includes('lamp') ? <g><path d="M255 239h17v9h-17zM259 220h8v21h-8z" fill="#e9d5a3" /><path d="M246 218h8v-6h19v6h8v12h-35z" fill="#bc8170" /><path d="M253 216h6v6h-6zM270 222h5v5h-5z" fill="#f8e5bc" /></g> : <><path d="M250 238h26v8h-26zM254 229h19v9h-19z" fill="#a0ad7f" /><path d="M256 232h16v3h-16z" fill="#e3dfb9" /></>}
        {/* Pixel rug. */}
        <path d="M247 330h325v7h15v72h-15v8H247v-8h-14v-72h14z" fill={equipped.includes('rug') ? '#9c7380' : '#8d9e76'} />
        <path d="M250 339h319v62H250zM243 346h335v49H243z" fill="url(#rugcheck)" />
        <path d="M242 347h-12v3h12zM242 357h-12v3h12zM242 367h-12v3h12zM242 377h-12v3h12zM242 387h-12v3h12zM578 347h12v3h-12zM578 357h12v3h-12zM578 367h12v3h-12zM578 377h12v3h-12zM578 387h12v3h-12z" fill={equipped.includes('rug') ? '#9c7380' : '#8d9e76'} />
        {/* A wooden exercise wheel. */}
        <path d="M643 280h12v52h-12zM615 331h68v9h-68z" fill="#9e8b63" />
        <path d="M618 162h61v7h20v14h12v18h7v56h-7v18h-12v14h-20v7h-61v-7h-20v-14h-12v-18h-7v-56h7v-18h12v-14h20z" fill="#9d9e76" />
        <path d="M620 172h57v7h17v13h11v18h5v40h-5v18h-11v12h-17v7h-57v-7h-17v-12h-11v-18h-5v-40h5v-18h11v-13h17z" fill="#d2cf9f" />
        <path d="M623 182h50v7h17v12h9v19h4v21h-4v20h-9v10h-17v7h-50v-7h-17v-10h-9v-20h-3v-21h3v-19h9v-12h17z" fill={night ? '#8d9f88' : '#c4d1ad'} />
        <g className={`room-wheel ${active || action === 'exercise' ? 'turning' : ''}`}><path d="M646 179h5v102h-5zM594 228h109v5H594z" fill="#a8ad7f" /><path d="M613 193l71 71-4 4-71-71zM682 193l4 4-71 71-4-4z" fill="#b0b68a" /><path d="M639 221h19v19h-19z" fill="#8b9369" /><path d="M644 226h9v9h-9z" fill="#e7dfb1" /></g>
        {/* Food dish, loose seeds and toy ball. */}
        <path d="M114 363h63v8h8v15h-8v7h-63v-7h-7v-15h7z" fill="#b18964" /><path d="M115 366h60v6h5v10h-67v-10h2z" fill="#dfc59b" /><path d="M124 369h43v8h-43z" fill="#918459" /><path d="M129 369h7v4h-7zM149 374h7v3h-7zM156 369h7v3h-7zM120 375h5v3h-5z" fill="#eddba3" />
        <path d="M191 401h6v3h-6zM177 412h5v4h-5zM200 415h6v3h-6z" fill="#bba06b" />
        <path d="M596 374h20v5h6v21h-6v5h-20v-5h-5v-21h5z" fill="#ac826d" /><path d="M599 378h14v5h5v14h-5v4h-14v-4h-4v-14h4z" fill="#d5aa8e" /><path d="M602 378h5v23h-5zM595 387h23v5h-23z" fill="#e3d5aa" />
        {/* Soft basket and a floor plant. */}
        <path d="M700 362h65v8h8v44h-8v8h-65v-8h-7v-44h7z" fill="#aa8f63" /><path d="M701 368h63v7h4v33h-67z" fill="#d6bd8a" /><path d="M708 378h49v3h-49zM708 389h49v3h-49zM708 400h49v3h-49zM721 375h3v33h-3zM741 375h3v33h-3z" fill="#b99c70" />
        {equipped.includes('fern') && <g><path d="M737 290h6v76h-6zM707 310h25v8h-25zM715 298h22v7h-22zM742 300h25v9h-25zM742 319h29v8h-29zM712 331h26v8h-26zM738 280h11v23h-11z" fill="#648750" /><path d="M711 309h20v4h-20zM746 300h21v4h-21zM717 331h19v4h-19z" fill="#94ae70" /></g>}
        {equipped.includes('garland') && <g><path d="M47 154h7v4h37v5h40v-5h39v-4h44v-5h7" stroke="#9e8f61" strokeWidth="2" fill="none" />{[65,115,165,208].map((x,i) => <path key={x} d={`M${x} ${163+(i%2)*8}h4v4h5v4h-4v5h-5v-5h-4v-4h4z`} fill="#dfbd6d" />)}</g>}
        {active && <g className="live-leaves"><path d="M340 254h8v4h4v8h-8v-4h-4zM477 293h8v4h4v8h-8v-4h-4zM538 237h8v4h4v8h-8v-4h-4z" fill="#7b9e66" /><path d="M368 297h4v4h5v3h-5v5h-4v-5h-4v-3h4zM488 197h4v4h5v3h-5v5h-4v-5h-4v-3h4z" fill="#f9e2a0" /></g>}
        {!night && <path d="M306 216h195l65 105H273z" fill="#f9edbc" opacity=".13" />}
        {night && <rect width="800" height="460" fill="#263b50" opacity=".14" />}
      </svg>
      <div className={`pet-position ${action ? `doing-${action}` : ''} ${sleeping ? 'is-sleeping' : ''}`}>
        <span className="pet-shadow" />
        <button className="pet-touch" onClick={onPet} aria-label={pet ? `Pet ${pet.name}` : 'Meet your future hamster'}><PetSprite coat={pet?.coat} stage={pet ? stageOf(pet) : 0} sleeping={sleeping} /></button>
        {sleeping && <span className="sleep-letters" aria-hidden="true">z z Z</span>}
        {action === 'clean' && <span className="soap-bubbles" aria-hidden="true"><i /><i /><i /></span>}
        {(action === 'play' || action === 'feed') && <span className="happy-heart" aria-hidden="true">♥</span>}
      </div>
      {active && <div className="world-breeze"><Sparkles size={14} /> A real wheel breeze</div>}
    </div>
  </div>;
}
