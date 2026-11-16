(()=>{
    const check=async()=>{
      try{
        const response=await fetch(`./site-version.json?t=${Date.now()}`,{cache:'no-store'});
        if(!response.ok)return;
        const data=await response.json();
        const version=String(data.version||'').trim();
        if(!version)return;
        if(!window.__CRX_SITE_VERSION){window.__CRX_SITE_VERSION=version;return;}
        if(window.__CRX_SITE_VERSION===version)return;
        location.reload();
      }catch(_){}
    };
    check();
    setInterval(check,60000);
  })();
