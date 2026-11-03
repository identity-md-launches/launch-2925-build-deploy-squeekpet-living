export function PixelIcon({ name, className = '' }: { name: string; className?: string }) {
  const art: Record<string,React.ReactNode> = {
    carrot: <><path fill="#59914e" d="M14 10V3h3v7h2V5h3v5h-3v4z"/><path fill="#9b623b" d="M10 10h9v3h4v5h-3v5h-3v4h-3v3H8v-5H6v-7h2v-5h2z"/><path fill="#eea154" d="M11 12h7v3h3v3h-3v5h-3v4h-4v-4H8v-5h3z"/><path fill="#c47a39" d="M10 16h5v2h-5zM12 22h4v2h-4z"/></>,
    play: <><path fill="#9b634b" d="M7 9h18v3h4v13h-4v3H7v-3H3V12h4z"/><path fill="#d9a48c" d="M7 12h18v3h2v8h-3v3H8v-3H5v-8h2z"/><path fill="#fff0d3" d="M12 11h5v15h-5z"/><path fill="#719a64" d="M7 16h19v5H7z"/></>,
    sleep: <><path fill="#b29662" d="M20 3v4h-4v6h3v4h7v-3h3v9h-4v4H14v-3H8v-5H5v-9h4V6h5V3z"/><path fill="#f4d58b" d="M16 5v7h2v6h7v4h-4v3h-8v-3H9v-5H7v-6h4V8h4V5z"/><path fill="#c4b58a" d="M25 3h3v3h3v3h-3v3h-3V9h-3V6h3z"/></>,
    clean: <><path fill="#638f91" d="M6 16h20v3h3v9H3v-9h3z"/><path fill="#a6cdcb" d="M6 19h20v6H6z"/><path fill="#eaf6e9" d="M6 14v-4h4V6h5v4h4v5h6v6H7z"/><path fill="#8cb5b4" d="M21 5h5v5h-5zM3 4h4v4H3z"/><path fill="#fffaf0" d="M22 5h2v2h-2zM10 8h3v3h-3z"/></>,
    exercise: <><path fill="#627d50" d="M10 2h12v3h5v5h3v12h-3v5h-5v3H10v-3H5v-5H2V10h3V5h5z"/><path fill="#c0c99b" d="M10 5h12v3h3v4h2v8h-2v4h-3v3H10v-3H7v-4H5v-8h2V8h3z"/><path fill="#638253" d="M14 5h4v8h9v5h-9v9h-4v-9H5v-5h9z"/><path fill="#e1d4a9" d="M12 12h8v8h-8z"/></>,
    acorn: <><path fill="#997045" d="M7 12h18v10h-3v5h-4v3h-4v-3h-4v-5H7z"/><path fill="#d3a165" d="M10 14h12v8h-3v4h-5v-4h-4z"/><path fill="#78593a" d="M13 5h8v3h4v3h3v5H5v-5h3V8h5zM16 1h4v5h-4z"/><path fill="#ad8551" d="M10 10h13v3H8v-2h2z"/></>,
    seed: <><path fill="#8c734b" d="M15 3h5v3h4v5h2v9h-3v5h-4v4h-7v-3H8v-5H6v-8h3V8h3V5h3z"/><path fill="#e9d8a2" d="M15 6h4v3h3v10h-3v5h-3v2h-3v-4h-3v-8h3V9h2z"/><path fill="#ac955f" d="M18 9h2v9h-2v5h-2v-9h2z"/></>,
    berry: <><path fill="#5f8d4f" d="M13 3h4v7h7v4H9V9h4z"/><path fill="#86505c" d="M7 12h17v3h4v11h-4v3H8v-3H4V16h3z"/><path fill="#d78b91" d="M8 15h14v3h3v6h-4v3H10v-3H7v-6h1z"/><path fill="#f9d4b4" d="M10 17h2v2h-2zM17 22h2v2h-2zM20 17h2v2h-2z"/></>,
    plant: <><path fill="#587747" d="M14 8h3v15h-3zM5 6h6v3h4v6H9v-3H5zM20 2h6v7h-3v4h-7V7h4z"/><path fill="#83a769" d="M5 6h6v3h4v3H9V9H5zM20 2h6v4h-6v5h-4V7h4z"/><path fill="#9e7451" d="M6 20h20v4h-3v7H9v-7H6z"/><path fill="#c99a6c" d="M8 21h16v2H8zM11 24h10v5H11z"/></>,
    star: <><path fill="#b29755" d="M13 2h6v8h10v7h-5v5h-3v8h-7v-5H8v5H3v-8h4v-5H2v-7h11z"/><path fill="#ebd28b" d="M14 6h4v7h8v3h-7v7h-5v-4H8v-5h6z"/></>,
    mushroom: <><path fill="#8e6250" d="M6 8h4V5h13v3h4v5h3v8H3v-8h3zM12 21h9v10h-9z"/><path fill="#cc8b79" d="M8 10h4V7h9v3h4v5h3v3H5v-5h3z"/><path fill="#f3dec0" d="M10 10h4v4h-4zM21 12h3v3h-3zM14 20h5v9h-5z"/></>,
    rug: <><path fill="#906075" d="M2 8h28v18H2z"/><path fill="#d5a6a4" d="M5 10h22v13H5z"/><path fill="#f2cfb2" d="M8 12h16v3H8zM8 18h16v3H8z"/><path fill="#a97989" d="M10 10h3v13h-3zM19 10h3v13h-3z"/></>,
  };
  return <svg className={`pixel-icon ${className}`} viewBox="0 0 32 32" fill="none" aria-hidden="true" shapeRendering="crispEdges">{art[name === 'feed' ? 'carrot' : name] ?? art.star}</svg>;
}
