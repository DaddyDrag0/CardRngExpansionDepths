(()=>{
    const valid=new Set(['default','scarlet','slate','lava']);
    let theme='slate';
    try{const saved=localStorage.getItem('crx-site-theme');if(valid.has(saved))theme=saved;
      const migration='crx-slate-default-nov2026-v1';
      if(!localStorage.getItem(migration)){theme='slate';localStorage.setItem(migration,'1');localStorage.setItem('crx-site-theme','slate');}}catch(_){}
    document.documentElement.dataset.theme=theme;
    window.addEventListener('DOMContentLoaded',()=>{
      const colors={default:'#080b10',scarlet:'#080406',slate:'#14191f',lava:'#090202'};
      const buttons=[...document.querySelectorAll('[data-theme-choice]')];
      const apply=(next,persist=true)=>{
        if(!valid.has(next))next='default';
        document.documentElement.dataset.theme=next;
        buttons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.themeChoice===next)));
        const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',colors[next]);
        if(persist){try{localStorage.setItem('crx-site-theme',next)}catch(_){}}
      };
      buttons.forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.themeChoice||'default')));
      apply(document.documentElement.dataset.theme||'default',false);
    });
  })();
