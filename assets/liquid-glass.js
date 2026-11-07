(function(){
  if(window.innerWidth>820)return;
  var SEL='.liquid-glass',S=-34;
  var defs=document.querySelector('#lg-defs defs'),n=0,NS='http://www.w3.org/2000/svg';
  if(!defs)return;
  function mapFor(w,h,rad,band){
    var sc=.5,W=Math.max(2,Math.round(w*sc)),H=Math.max(2,Math.round(h*sc)),r=rad*sc,b=band*sc;
    var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),im=x.createImageData(W,H),d=im.data;
    for(var j=0;j<H;j++)for(var i=0;i<W;i++){
      var px=i+.5,py=j+.5,cx=Math.min(Math.max(px,r),W-r),cy=Math.min(Math.max(py,r),H-r),dist,nx=0,ny=0;
      if((px<r||px>W-r)&&(py<r||py>H-r)){var dx=px-cx,dy=py-cy,L=Math.hypot(dx,dy)||1;dist=r-L;nx=dx/L;ny=dy/L}
      else{var dl=px,dr=W-px,dt=py,db=H-py,m=Math.min(dl,dr,dt,db);dist=m;if(m===dl)nx=-1;else if(m===dr)nx=1;else if(m===dt)ny=-1;else ny=1}
      var s=dist<b?Math.pow(1-Math.max(dist,0)/b,2):0,k=(j*W+i)*4;
      d[k]=Math.round(128+127*s*nx);d[k+1]=128;d[k+2]=Math.round(128+127*s*ny);d[k+3]=255}
    x.putImageData(im,0,0);return c.toDataURL('image/png');
  }
  function filterFor(el){
    var w=el.offsetWidth,h=el.offsetHeight;if(w<4||h<4)return null;
    var rad=Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius)||0,h/2,w/2);
    var key=w+'x'+h+'r'+rad;if(el._lgKey===key)return el._lgId;
    var id=el._lgId||('lg'+(n++)),f=document.getElementById(id);
    if(!f){f=document.createElementNS(NS,'filter');f.id=id;defs.appendChild(f)}
    ['x','y'].forEach(function(a){f.setAttribute(a,'0')});
    f.setAttribute('width',w);f.setAttribute('height',h);
    f.setAttribute('filterUnits','userSpaceOnUse');f.setAttribute('primitiveUnits','userSpaceOnUse');
    f.setAttribute('color-interpolation-filters','sRGB');
    f.innerHTML='<feImage href="'+mapFor(w,h,rad,Math.min(26,h*.42))+'" x="0" y="0" width="'+w+'" height="'+h+'" preserveAspectRatio="none" result="m"/>'+
      '<feDisplacementMap in="SourceGraphic" in2="m" scale="'+S+'" xChannelSelector="R" yChannelSelector="B"/>';
    el._lgKey=key;el._lgId=id;return id;
  }
  function wrap(){
    document.querySelectorAll(SEL).forEach(function(el){
      var w=el.querySelector(':scope > .lg-warp');
      if(!w){
        w=document.createElement('span');w.className='lg-warp';w.setAttribute('aria-hidden','true');
        var r=document.createElement('span');r.className='lg-rim';r.setAttribute('aria-hidden','true');
        el.prepend(w);el.appendChild(r);
      }
      var id=filterFor(el);if(!id)return;
      w.style.filter='url(#'+id+')';
      w.style.clipPath='inset(0 round '+getComputedStyle(el).borderTopLeftRadius+')';
    });
  }
  addEventListener('resize',function(){clearTimeout(wrap._t);wrap._t=setTimeout(wrap,150)});
  new MutationObserver(function(){requestAnimationFrame(wrap)}).observe(document.body,{childList:true,subtree:true});
  wrap();setTimeout(wrap,300);
})();
