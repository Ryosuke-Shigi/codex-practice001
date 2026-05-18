import{j as t}from"./app-_hiJOeIX.js";function i(e){return e==="large"?20:e==="small"?14:17}function l(e){return e==="large"?10:e==="small"?8:9}function m({pin:e}){const a=i(e.sizeLabel),n=l(e.sizeLabel);return t.jsxs("div",{className:"flex min-w-0 items-center gap-2.5",children:[t.jsxs("span",{className:"relative flex h-8 w-8 shrink-0 items-center justify-center",children:[t.jsx("span",{className:"rotate-45 border border-white/70",style:{backgroundColor:e.color,borderRadius:"50% 50% 50% 0",boxShadow:`0 0 14px ${e.color}66`,height:a,width:a},"aria-hidden":"true"}),t.jsx("span",{className:"absolute flex items-center justify-center font-bold leading-none text-slate-950",style:{fontSize:n,height:a,width:a},"aria-hidden":"true",children:e.maxIntensity})]}),t.jsxs("span",{className:"min-w-0",children:[t.jsx("span",{className:"block text-sm font-semibold text-white",children:e.label}),t.jsxs("span",{className:"block text-xs leading-5 text-slate-200/70",children:["max ",e.maxIntensity," / ",e.sizeLabel]})]})]})}function u({ripple:e}){const a=Array.from({length:e.ringCount}),r=Number.parseFloat(e.duration)/Math.max(e.ringCount,1);return t.jsxs("div",{className:"flex min-w-0 items-center gap-4",children:[t.jsx("style",{children:`
                    @keyframes quake-wave-preview-spread {
                        0% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.18);
                        }
                        12% {
                            opacity: 0.72;
                        }
                        72% {
                            opacity: 0.28;
                        }
                        100% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(1);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .quake-wave-preview-ring {
                            animation: none !important;
                            opacity: 0.42 !important;
                            transform: translate(-50%, -50%) scale(0.78) !important;
                        }
                    }
                `}),t.jsxs("span",{className:"relative shrink-0",style:{height:e.size,width:e.size},"aria-hidden":"true",children:[a.map((c,s)=>{const o=s===0?2:1;return t.jsx("span",{className:"quake-wave-preview-ring absolute left-1/2 top-1/2 rounded-full border",style:{animation:`quake-wave-preview-spread ${e.duration} cubic-bezier(0.16, 1, 0.3, 1) infinite`,animationDelay:`${s*-r}s`,animationFillMode:"both",borderColor:e.color,borderWidth:o,boxShadow:`0 0 20px ${e.color}44`,height:e.size,width:e.size}},`${e.label}-${s}`)}),t.jsx("span",{className:"absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70",style:{backgroundColor:e.color,boxShadow:`0 0 18px ${e.color}88`}})]}),t.jsxs("span",{className:"min-w-0",children:[t.jsx("span",{className:"block text-sm font-semibold text-white",children:e.label}),t.jsxs("span",{className:"block text-xs leading-5 text-slate-200/70",children:["max ",e.maxIntensity," / ",e.ringCount," rings / ",e.duration]})]})]})}export{m as E,u as a};
