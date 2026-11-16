const links=[...document.querySelectorAll('nav a')];
const rooms=[...document.querySelectorAll('.room')];
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}})},{rootMargin:'-35% 0px -55% 0px'});
rooms.forEach(r=>observer.observe(r));
console.info('REM Projects · Projects House · skeleton online');

/* Data layer: the pages read the canonical JSON records and render
   themselves. One authoritative record per thing; every room is a view.
   Workers and sessions write only to the records, never to the pages. */

function fetchRecords(path){
  return fetch(path).then(function(r){
    if(!r.ok){ throw new Error('fetch failed: '+path); }
    return r.json();
  });
}

function line(text){
  const d=document.createElement('div');
  d.textContent=text;
  return d;
}

function smallLine(text){
  const s=document.createElement('small');
  s.textContent=text;
  return s;
}

function card(title, lines){
  const a=document.createElement('article');
  const st=document.createElement('strong');
  st.textContent=title;
  a.appendChild(st);
  lines.forEach(function(t){
    a.appendChild(document.createElement('br'));
    a.appendChild(smallLine(t));
  });
  return a;
}

function fillError(container){
  container.textContent='';
  const d=document.createElement('div');
  d.className='empty-state';
  d.textContent='Records could not be loaded.';
  container.appendChild(d);
}

function provenanceLine(rec){
  return 'Provenance: '+rec.provenance+' · Last verified: '+rec.last_verified;
}

/* Library: works.json, grouped by form. */
function renderLibrary(){
  const books=document.getElementById('library-books');
  const series=document.getElementById('library-series');
  if(!books || !series){ return; }
  fetchRecords('data/works.json').then(function(data){
    books.textContent='';
    series.textContent='';
    data.works.forEach(function(w){
      const c=card(w.title,[w.form, w.status, provenanceLine(w)]);
      if(w.form.indexOf('Series')!==-1){ series.appendChild(c); }
      else { books.appendChild(c); }
    });
  }).catch(function(){ fillError(books); fillError(series); });
}

/* Publishing: submissions.json, grouped by state. */
function ledgerGroup(rec){
  const s=(rec.status||'').toLowerCase();
  if(s.indexOf('declined')!==-1 || s.indexOf('not selected')!==-1 ||
     s.indexOf('returned')!==-1 || s.indexOf('pass')!==-1){
    return 'returned';
  }
  if(rec.provenance==='Reported' || rec.provenance==='Unknown'){
    return 'unverified';
  }
  return 'awaiting';
}

function renderPublishing(){
  const groups={
    awaiting: document.getElementById('ledger-awaiting'),
    returned: document.getElementById('ledger-returned'),
    unverified: document.getElementById('ledger-unverified')
  };
  if(!groups.awaiting || !groups.returned || !groups.unverified){ return; }
  fetchRecords('data/submissions.json').then(function(data){
    Object.keys(groups).forEach(function(k){ groups[k].textContent=''; });
    data.submissions.forEach(function(rec){
      const lines=[
        rec.market+' · '+rec.market_type,
        rec.status,
        'Submitted: '+rec.date_submitted+' · '+provenanceLine(rec),
        'Next: '+rec.next_action
      ];
      groups[ledgerGroup(rec)].appendChild(card(rec.work_title, lines));
    });
  }).catch(function(){
    Object.keys(groups).forEach(function(k){ fillError(groups[k]); });
  });
}

/* Webworks: webworks.json, one list. */
function renderWebworks(){
  const list=document.getElementById('webworks-list');
  if(!list){ return; }
  fetchRecords('data/webworks.json').then(function(data){
    list.textContent='';
    data.webworks.forEach(function(p){
      const c=card(p.name,[p.location, p.status, provenanceLine(p)]);
      list.appendChild(c);
    });
  }).catch(function(){ fillError(list); });
}

/* Workshop: works.json, the bench marks decide. */
function renderWorkshop(){
  const list=document.getElementById('workbench-list');
  if(!list){ return; }
  fetchRecords('data/works.json').then(function(data){
    list.textContent='';
    data.works.forEach(function(w){
      if(w.on_workbench===true){
        list.appendChild(card(w.title,[w.form, w.status, provenanceLine(w)]));
      }
    });
  }).catch(function(){ fillError(list); });
}

/* Foyer: signals derived from all registries. */
function signalCard(label, big, small, href){
  const a=document.createElement('article');
  const sp=document.createElement('span');
  sp.textContent=label;
  const st=document.createElement('strong');
  st.textContent=big;
  const sm=document.createElement('small');
  sm.textContent=small;
  a.appendChild(sp);
  a.appendChild(st);
  a.appendChild(sm);
  if(href){
    a.style.cursor='pointer';
    a.addEventListener('click', function(){ window.location.href=href; });
  }
  return a;
}

function renderFoyer(){
  const grid=document.getElementById('foyer-signals');
  const activity=document.getElementById('foyer-activity');
  if(!grid || !activity){ return; }
  Promise.all([
    fetchRecords('data/works.json'),
    fetchRecords('data/submissions.json'),
    fetchRecords('data/webworks.json'),
    fetchRecords('data/activity.json')
  ]).then(function(results){
    const works=results[0].works;
    const subs=results[1].submissions;
    const sites=results[2].webworks;
    const events=results[3].events;

    let awaiting=0, overdue=0, decisions=0;
    subs.forEach(function(rec){
      if(ledgerGroup(rec)==='awaiting'){ awaiting++; }
      if((rec.status||'').toLowerCase().indexOf('overdue')!==-1){ overdue++; }
      if((rec.next_action||'').toLowerCase().indexOf('approval')!==-1){ decisions++; }
    });
    const bench=works.filter(function(w){ return w.on_workbench===true; }).length;
    let sitesNeedingEyes=0;
    sites.forEach(function(p){
      const s=(p.status||'').toLowerCase();
      if(s.indexOf('in development')!==-1 || s.indexOf('check due')!==-1){ sitesNeedingEyes++; }
    });

    grid.textContent='';
    grid.appendChild(signalCard('Publishing', awaiting+' awaiting a decision',
      overdue+' overdue item'+(overdue===1?'':'s')+' · '+decisions+' need your approval', 'publishing.html'));
    grid.appendChild(signalCard('Library', works.length+' works on record',
      'One work, one canonical record, many useful views.', 'library.html'));
    grid.appendChild(signalCard('Workshop', bench+' on the bench',
      'Active development has its own workbench.', 'workshop.html'));
    grid.appendChild(signalCard('Study', 'Research & inquiry',
      'Records kept by hand for now.', 'study.html'));
    grid.appendChild(signalCard('Webworks', sites.length+' properties',
      sitesNeedingEyes+' in development or due a check', 'webworks.html'));
    grid.appendChild(signalCard('Archives', 'History & provenance',
      'Nothing disappears; superseded states live here.', 'archives.html'));
    grid.appendChild(signalCard('House rule', 'Approval required',
      'No substantive manuscript change without Remy approval.', null));

    activity.textContent='';
    events.slice(-4).reverse().forEach(function(ev){
      activity.appendChild(card(ev.date+' · '+ev.type, [ev.summary]));
    });
  }).catch(function(){ fillError(grid); fillError(activity); });
}

document.addEventListener('DOMContentLoaded', function(){
  renderLibrary();
  renderPublishing();
  renderWebworks();
  renderWorkshop();
  renderFoyer();
});
