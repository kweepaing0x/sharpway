import{j as e,X as u,Q as b,d as h,k as g,R as f,H as p,b as j,V as N,z as v,W as w,Y as k,e as y,S as x,h as S,B as $,J as C,K as A,Z as L}from"./ui-components-CL-10tNC.js";import{u as O,i as l,r as o,N as M,O as T}from"./react-vendor-NfsKhbMh.js";import{a as m,c as z}from"./index-DNL726t5.js";import"./supabase-DQ7Oc2S5.js";const d=({isOpen:a,onClose:t=()=>{}})=>(O(),e.jsxs(e.Fragment,{children:[a&&e.jsx("div",{className:"fixed inset-0 z-40 lg:hidden",onClick:t,children:e.jsx("div",{className:"absolute inset-0 bg-gray-600 opacity-75"})}),e.jsx("div",{className:`
        ${a?"fixed inset-0 flex z-40":"hidden"}
        lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50
      `,children:e.jsxs("div",{className:`
          flex-1 flex flex-col min-h-0 bg-blue-700
          w-full lg:w-64
          transition-transform duration-300 ease-in-out
          ${a?"translate-x-0":"-translate-x-full"}
          lg:translate-x-0
        `,children:[e.jsxs("div",{className:"flex items-center justify-between h-16 flex-shrink-0 px-4 bg-blue-800 dark:bg-blue-900",children:[e.jsx("div",{className:"flex items-center",children:e.jsx("h1",{className:"text-xl font-bold text-white",children:"Mall Admin"})}),e.jsxs("button",{className:"lg:hidden text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white",onClick:t,children:[e.jsx("span",{className:"sr-only",children:"Close sidebar"}),e.jsx(u,{className:"h-6 w-6","aria-hidden":"true"})]})]}),e.jsx("div",{className:"flex-1 flex flex-col overflow-y-auto",children:e.jsxs("nav",{className:"flex-1 px-2 py-4 space-y-1 bg-blue-700 dark:bg-blue-800",children:[e.jsxs(l,{to:"/admin",end:!0,className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(b,{className:"mr-3 h-6 w-6"}),"Dashboard"]}),e.jsxs(l,{to:"/admin/stores",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(h,{className:"mr-3 h-6 w-6"}),"Stores"]}),e.jsxs(l,{to:"/admin/products",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(g,{className:"mr-3 h-6 w-6"}),"Products"]}),e.jsxs(l,{to:"/admin/categories",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(f,{className:"mr-3 h-6 w-6"}),"Categories"]}),e.jsxs(l,{to:"/admin/hotels",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(p,{className:"mr-3 h-6 w-6"}),"Hotels"]}),e.jsxs(l,{to:"/admin/taxis",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(j,{className:"mr-3 h-6 w-6"}),"Taxis"]}),e.jsxs(l,{to:"/admin/managers",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(N,{className:"mr-3 h-6 w-6"}),"Store Managers"]}),e.jsxs(l,{to:"/admin/fraud-list",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(v,{className:"mr-3 h-6 w-6"}),"Fraud List"]}),e.jsxs(l,{to:"/admin/announcements",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(w,{className:"mr-3 h-6 w-6"}),"Announcements"]}),e.jsxs(l,{to:"/admin/ads",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(k,{className:"mr-3 h-6 w-6"}),"Pop-up Ads"]}),e.jsxs(l,{to:"/admin/sponsored-content",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(y,{className:"mr-3 h-6 w-6"}),"Sponsored Content"]}),e.jsxs(l,{to:"/admin/google-indexing",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(x,{className:"mr-3 h-6 w-6"}),"Google Indexing"]}),e.jsxs(l,{to:"/admin/settings",className:({isActive:s})=>`
                  ${s?"bg-blue-800 text-white dark:bg-blue-900":"text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700"}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md
                  transition-colors duration-150
                `,onClick:()=>t(),children:[e.jsx(S,{className:"mr-3 h-6 w-6"}),"Settings"]})]})})]})})]})),B=({onMenuClick:a})=>{var i;const{user:t,signOut:s}=m(),{currentTheme:r,toggleTheme:n}=z();return e.jsx(e.Fragment,{children:e.jsx("header",{className:"bg-theme-header shadow-sm z-10",children:e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex justify-between h-16",children:[e.jsxs("div",{className:"flex",children:[e.jsxs("button",{type:"button",className:"px-4 border-r border-theme text-theme-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden",onClick:a,children:[e.jsx("span",{className:"sr-only",children:"Open sidebar"}),'className="max-w-xs bg-theme-card rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"']}),e.jsx("div",{className:"flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start",children:e.jsxs("div",{className:"max-w-lg w-full lg:max-w-xs",children:[e.jsx("label",{htmlFor:"search",className:"sr-only",children:"Search"}),e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",children:e.jsx(x,{className:"h-5 w-5 text-theme-tertiary","aria-hidden":"true"})}),e.jsx("input",{name:"search",className:"block w-full pl-10 pr-3 py-2 border border-theme rounded-md leading-5 bg-theme-input placeholder-theme-tertiary text-theme-primary focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",placeholder:"Search",type:"search"})]})]})})]}),e.jsxs("div",{className:"flex items-center",children:[e.jsx($,{variant:"ghost",onClick:n,className:"p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors duration-200 mr-2","aria-label":`Switch to ${r==="light"?"dark":"light"} mode`,children:r==="light"?e.jsx(C,{className:"h-5 w-5"}):e.jsx(A,{className:"h-5 w-5"})}),e.jsxs("button",{type:"button",className:"ml-4 p-2 text-theme-secondary hover:text-theme-primary",children:[e.jsx("span",{className:"sr-only",children:"View notifications"}),e.jsx(L,{className:"h-6 w-6"})]}),e.jsxs("div",{className:"ml-4 flex items-center",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx("div",{className:"h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center",children:e.jsx("span",{className:"text-lg font-medium text-white",children:((i=t==null?void 0:t.email)==null?void 0:i.substring(0,1).toUpperCase())||"A"})})}),e.jsx("div",{className:"ml-3",children:e.jsxs("button",{type:"button",className:"max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",id:"user-menu-button",children:[e.jsx("span",{className:"sr-only",children:"Open user menu"}),e.jsxs("div",{className:"flex flex-col items-start",children:[e.jsx("span",{className:"text-sm font-medium text-gray-700",children:(t==null?void 0:t.email)||"Admin User"}),e.jsx("button",{onClick:s,className:"text-xs text-gray-500 hover:text-red-500",children:"Sign out"})]})]})})]})]})]})})})})},c=()=>e.jsxs("div",{className:"flex flex-col flex-1 items-center justify-center",children:[e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"}),e.jsx("p",{className:"mt-4 text-gray-500",children:"Loading..."})]}),E=()=>{const[a,t]=o.useState(!1),{user:s,loading:r,isSuperAdmin:n}=m();return r?e.jsx(c,{}):!s||!n?e.jsx(M,{to:"/admin/login",replace:!0}):e.jsxs("div",{className:"h-screen flex overflow-hidden bg-theme-secondary",children:[e.jsx(d,{isOpen:a,onClose:()=>t(!1)}),e.jsx("div",{className:"hidden lg:flex lg:flex-shrink-0",children:e.jsx("div",{className:"flex flex-col w-64",children:e.jsx(d,{isOpen:!0})})}),e.jsxs("div",{className:"flex flex-col w-0 flex-1 overflow-hidden",children:[e.jsx(B,{onMenuClick:()=>t(!0)}),e.jsx("main",{className:"flex-1 relative overflow-y-auto focus:outline-none",children:e.jsx("div",{className:"py-6",children:e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 md:px-8",children:e.jsx(o.Suspense,{fallback:e.jsx(c,{}),children:e.jsx(T,{})})})})})]})]})};export{E as default};
