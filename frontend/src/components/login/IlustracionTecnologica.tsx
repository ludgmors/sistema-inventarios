export function IlustracionTecnologica() {
  return (
    <svg viewBox="0 0 600 310" fill="none" role="img" aria-labelledby="tecnologia-titulo" className="h-full w-full">
      <title id="tecnologia-titulo">Plataforma digital con servidores, datos y conexiones seguras</title>
      <defs>
        <linearGradient id="plataforma" x1="300" y1="110" x2="300" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#113f46"/><stop offset="1" stopColor="#071d2a"/></linearGradient>
        <linearGradient id="servidor" x1="255" y1="60" x2="350" y2="215" gradientUnits="userSpaceOnUse"><stop stopColor="#185b5c"/><stop offset="1" stopColor="#0b2834"/></linearGradient>
        <linearGradient id="pantalla" x1="80" y1="100" x2="180" y2="200" gradientUnits="userSpaceOnUse"><stop stopColor="#0a303c"/><stop offset="1" stopColor="#051722"/></linearGradient>
        <radialGradient id="halo"><stop stopColor="#00d7b0" stopOpacity=".24"/><stop offset="1" stopColor="#00d7b0" stopOpacity="0"/></radialGradient>
        <filter id="brillo"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <ellipse cx="300" cy="204" rx="260" ry="100" fill="url(#halo)"/>
      <g stroke="#15585e" strokeWidth=".7" opacity=".55">
        {[0,1,2,3,4,5,6].map(i=><path key={`a${i}`} d={`M ${45+i*48} ${165-i*18} l 268 100`}/>)}
        {[0,1,2,3,4,5,6].map(i=><path key={`b${i}`} d={`M ${45+i*45} ${165+i*17} l 265 -100`}/>)}
      </g>
      <path d="m180 214 120-47 120 47-120 48-120-48Z" fill="#04151e" stroke="#168c83"/>
      <path d="m180 207 120-47 120 47-120 48-120-48Z" fill="url(#plataforma)" stroke="#27b7a0" strokeOpacity=".55"/>
      <path d="m215 208 85-33 85 33-85 34-85-34Z" stroke="#32edc3" strokeOpacity=".4"/>
      <g stroke="#24c6a5" strokeWidth="1.2" strokeLinecap="round">
        <path d="m217 207-55-21-62 24M385 207l53-21 65 24M300 245v33M300 166v-33l91-35M220 190l-37-14v-45" strokeDasharray="4 5" opacity=".8"/>
        <path d="m141 245 58-22M399 244l64-24" opacity=".6"/>
      </g>
      <g>
        <path d="m253 83 47-19 49 19-48 19-48-19Z" fill="#247b72" stroke="#59dfc0" strokeOpacity=".7"/>
        <path d="M253 83v116l48 20V102l-48-19Z" fill="url(#servidor)" stroke="#2e9d91"/>
        <path d="M301 102v117l48-20V83l-48 19Z" fill="#092a35" stroke="#24716d"/>
        {[0,1,2,3].map(i=><g key={i}>
          <path d={`m260 ${101+i*25} 33 13v16l-33-13v-16Z`} fill="#092530" stroke="#2c6c69"/>
          <path d={`m266 ${109+i*25} 14 5`} stroke="#57d4bc" strokeWidth="2"/>
          <circle cx="286" cy={119+i*25} r="1.9" fill="#3af2bb"/>
          <path d={`m309 ${115+i*25} 31-12v15l-31 12v-15Z`} fill="#0b3440" stroke="#1a5b60"/>
          <path d={`m316 ${118+i*25} 15-6`} stroke="#1b807c"/>
        </g>)}
        <path d="m282 80 18-7 19 7-18 8-19-8Z" fill="#35d0ae" fillOpacity=".35" stroke="#64f5cc"/>
      </g>
      <g>
        <path d="m63 194 67-26 67 26-67 27-67-27Z" fill="#092934" stroke="#1e696c"/>
        <path d="M83 171v-65l78-31v66l-78 30Z" fill="#123b46" stroke="#2e8c87" strokeWidth="2"/>
        <path d="M90 158v-47l63-25v47l-63 25Z" fill="url(#pantalla)"/>
        <path d="m115 159 14-5v22l-14 5v-22Z" fill="#20565a"/>
        <path d="m101 185 28-11 25 10-29 11-24-10Z" fill="#1c4b51" stroke="#2d7575"/>
        {[0,1,2,3].map(i=><path key={i} d={`m${98+i*13} ${144-i*6} v${-9-i*5} l7-3 v${9+i*5} l-7 3Z`} fill={i===3?'#55efc5':'#17a98e'}/>)}
        <path d="m98 118 11-5m4-1 24-10" stroke="#3a8487" strokeWidth="2"/>
      </g>
      <g>
        <path d="m423 167 64 25v-72l-64-25v72Z" fill="#0a2834" stroke="#27b5a2"/>
        <path d="m431 114 48 19m-48-10 29 11" stroke="#2f7678" strokeWidth="2"/>
        {[0,1,2].map(i=><g key={i}><path d={`m433 ${136+i*13} 3 4 6-4`} stroke="#50e7bd" strokeWidth="1.8"/><path d={`m450 ${143+i*13} 27 10`} stroke="#286a6f" strokeWidth="2"/></g>)}
      </g>
      <g>
        <path d="m412 248 29-11 30 11-30 12-29-12Z" fill="#17414c" stroke="#277c77"/>
        <path d="M421 243v-29l20-8 20 8v29l-20 8-20-8Z" fill="#0d333e" stroke="#289f92"/>
        <path d="m421 214 20 8 20-8M441 222v29" stroke="#36b39b"/>
        <path d="m428 214 13-5 13 5-13 5-13-5Z" fill="#3ad0ad" fillOpacity=".6"/>
      </g>
      <g>
        <path d="m126 250 25-10 25 10-25 10-25-10Z" fill="#15414a" stroke="#287a75"/>
        <path d="M136 242v-18l15-6 15 6v18l-15 6-15-6Z" fill="#0e353e" stroke="#25ac95"/>
        <path d="m136 224 15 6 15-6m-15 6v18" stroke="#4cddbb"/>
      </g>
      {[[100,210],[300,278],[391,98],[503,210],[183,131]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="7" fill="#31eeb5" opacity=".4" filter="url(#brillo)"/><circle cx={x} cy={y} r="3" fill="#66f8ce"/></g>)}
      <path d="m365 68 13-5 13 5v15c0 10-13 18-13 18s-13-9-13-18V68Z" fill="#0c3b42" stroke="#3bdbb4"/>
      <path d="m372 80 4 4 8-9" stroke="#71f5cf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
