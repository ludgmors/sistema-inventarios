export const claveTema = "inventarios-tema-login";
export const scriptTema = `(function(){try{var t=localStorage.getItem('${claveTema}');if(t!=='claro'&&t!=='oscuro')t=matchMedia('(prefers-color-scheme: dark)').matches?'oscuro':'claro';document.documentElement.dataset.tema=t}catch(e){document.documentElement.dataset.tema='claro'}})();`;
