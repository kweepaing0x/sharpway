function l(t,n){const e=t.replace(/^@/,"").replace(/^https?:\/\/(t\.me|telegram\.me)\//,""),o=encodeURIComponent(n);return`https://t.me/${e}?text=${o}`}function s(t,n){const e=l(t,n);window.open(e,"_blank")}function i(t,n){let e=`Hello! I want to buy the following items from ${t}:

`;n.forEach((a,r)=>{e+=`${r+1}. ${a.name} x${a.quantity} - $${(a.price*a.quantity).toFixed(2)}
`});const o=n.reduce((a,r)=>a+r.price*r.quantity,0);return e+=`
Total: $${o.toFixed(2)}

Please confirm my order. Thank you!`,e}function c(t,n,e){return`Hello! I want to check in to Room ${n} (${e}) at ${t}. Please let me know the availability and booking process. Thank you!`}function u(t,n,e){let o=`Hello ${t}! I want to hire your ${n} service`;return e&&(o+=` from ${e}`),o+=". Please let me know your availability. Thank you!",o}export{u as a,i as b,c as g,s as o};
