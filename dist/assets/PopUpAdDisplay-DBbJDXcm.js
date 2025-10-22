import{s as b,j as t,X as C}from"./ui-components-CL-10tNC.js";import{r as n}from"./react-vendor-NfsKhbMh.js";const N=({targetPage:a,storeId:c})=>{const[i,x]=n.useState(null),[g,o]=n.useState(!1),[w,y]=n.useState(new Set),[s,_]=n.useState(!1);n.useEffect(()=>{const e=()=>{_(window.innerWidth<768)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),n.useEffect(()=>{u();const e=b.channel("pop_up_ads").on("postgres_changes",{event:"*",schema:"public",table:"pop_up_ads"},()=>{u()}).subscribe();return()=>{e.unsubscribe()}},[a,c]);const u=async()=>{try{let e=b.from("pop_up_ads").select("*").eq("is_active",!0).eq("target_page",a);const r=new Date().toISOString();e=e.lte("start_date",r).or(`end_date.is.null,end_date.gte.${r}`),a==="store"&&c?e=e.eq("store_id",c):a==="home"&&(e=e.is("store_id",null));const{data:j,error:h}=await e.order("created_at",{ascending:!1});if(h)throw h;const f=j||[];if(f.length>0){const d=f.filter(l=>l.display_frequency==="once_per_session"?!w.has(l.id):!0);if(d.length>0){const l=d[Math.floor(Math.random()*d.length)];v(l)}}}catch(e){console.error("Error fetching ads:",e)}},v=e=>{x(e),o(!0),e.display_frequency==="once_per_session"&&y(r=>new Set(r).add(e.id)),setTimeout(()=>{o(!1)},s?15e3:1e4)},p=()=>{o(!1)},m=()=>{i!=null&&i.link_url&&window.open(i.link_url,"_blank","noopener,noreferrer"),o(!1)},k=e=>{!s&&e.target===e.currentTarget&&p()};return!i||!g?null:t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center",onClick:k,style:{padding:s?"16px":"24px"},children:t.jsxs("div",{className:`relative bg-white rounded-lg shadow-2xl overflow-hidden animate-scale-in ${s?"w-full max-w-sm max-h-[80vh]":"max-w-md w-full max-h-[80vh]"}`,onClick:e=>e.stopPropagation(),children:[t.jsx("button",{onClick:p,className:`absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors ${s?"p-2 touch-manipulation":"p-1"}`,"aria-label":"Close advertisement",children:t.jsx(C,{className:s?"h-5 w-5":"h-4 w-4"})}),t.jsxs("div",{className:`relative ${i.link_url?"cursor-pointer":""}`,onClick:i.link_url?m:void 0,children:[t.jsx("img",{src:i.image_url,alt:"Advertisement",className:"w-full h-auto object-cover",style:{maxHeight:s?"60vh":"70vh",minHeight:s?"200px":"300px"},loading:"lazy"}),i.link_url&&t.jsx("div",{className:"absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-colors flex items-center justify-center",children:t.jsx("div",{className:"bg-white bg-opacity-90 px-4 py-2 rounded-full font-medium text-gray-800 opacity-0 hover:opacity-100 transition-opacity text-sm",children:s?"Tap to learn more":"Click to learn more"})})]}),s&&i.link_url&&t.jsx("div",{className:"p-3 bg-gray-50 border-t",children:t.jsx("button",{onClick:m,className:"w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors touch-manipulation",children:"Learn More"})})]})}),t.jsx("style",{jsx:!0,children:`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        /* Mobile-specific styles */
        @media (max-width: 767px) {
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-black.bg-opacity-50 {
            background-color: rgba(0, 0, 0, 0.8);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-scale-in {
            animation: none;
          }
        }

        /* Touch-friendly close button */
        @media (max-width: 767px) {
          button[aria-label="Close advertisement"] {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `})]})};export{N as P};
