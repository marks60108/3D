import { chromium } from "playwright";
const dir="/tmp/claude-0/-home-user-3D/dc0a8e62-076b-5a27-88d6-56491fd67ab9/scratchpad";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--use-gl=swiftshader","--no-sandbox"]});
const p=await b.newPage({viewport:{width:1000,height:820}});
await p.goto("http://localhost:5173/",{waitUntil:"networkidle"});
await p.waitForTimeout(2500);
await p.selectOption("select","usagi-mace"); await p.waitForTimeout(1600);
await p.evaluate(()=>{const l=[...document.querySelectorAll("label")].find(x=>/整支對半分印/.test(x.textContent||""));const cb=l&&(l.querySelector('input[type=checkbox]')||document.getElementById(l.htmlFor));if(cb&&!cb.checked)cb.click();});
await p.waitForTimeout(1500);
const box=await p.$eval("canvas",el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
await p.mouse.move(box.x,box.y); for(let i=0;i<9;i++){await p.mouse.wheel(0,-120);}
await p.waitForTimeout(700);
await p.screenshot({path:dir+"/mace-split-joints.png"});
await b.close();
