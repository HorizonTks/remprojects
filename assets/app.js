const links=[...document.querySelectorAll('nav a')];
const rooms=[...document.querySelectorAll('.room')];
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}})},{rootMargin:'-35% 0px -55% 0px'});
rooms.forEach(r=>observer.observe(r));
console.info('REM Projects · Projects House · skeleton online');