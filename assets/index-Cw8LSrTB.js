(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();const p="snowcone_save_data";function c(){const e=localStorage.getItem(p);try{return e?JSON.parse(e):r()}catch(t){return console.error("💥 Failed to parse stored data:",t),r()}}function g(e){localStorage.setItem(p,JSON.stringify(e))}function b(e){var t;return(t=c().settings)==null?void 0:t[e]}function f(e,t){const n=c();n.settings[e]=t,g(n)}function r(){return{profile:{username:"Guest",xp:0,level:1,badges:[],completedModes:[],lastPlayed:null,seenIntro:!1},settings:{theme:"menubackground",mute:!1,difficulty:"normal"},stats:{quickServe:{sessions:0,topScore:0},infinity:{timeSpent:0},story:{chapter:0}},storyProgress:{currentChapter:0,seenPanels:[]},created:Date.now()}}function L(){const e=c(),t=Object.keys(allBadges).length;let n=0;n+=Math.min(e.profile.xp,100)*.5;const s=e.profile.badges.length/t*20;return n+=s,e.stats.story.chapter>=FINAL_CHAPTER&&(n+=15),e.stats.quickServe.topScore>=50&&(n+=10),e.stats.quickServe.sessions>0&&e.stats.infinity.timeSpent>0&&e.storyProgress.seenPanels.length>0&&(n+=5),Math.min(100,Math.round(n))}window.devFlags={build:"v0.1.9"};function y(){var s;const e=document.getElementById("menuImage");if(!e){console.warn("🍧 No menuImage element found!");return}let n=(s=c().settings)==null?void 0:s.theme;(!n||typeof n!="string"||n==="default")&&(n="menubackground",f("theme",n)),e.src=`assets/img/branding/${n}.png`,console.log("🧊 Background set to:",n),T(n)}function T(e){const t=M[e];t&&Object.entries(t).forEach(([n,s])=>{const o=document.querySelector(`.menu-label.${n}`);o&&(o.style.color=s)})}function S(e){const t=document.getElementById("menuImage");if(!t){console.warn("🚨 No #menuImage found to swap.");return}typeof f=="function"&&f("theme",e),t.src=`assets/img/branding/${e}.png`,console.log(`🌌 Swapped to theme: ${e}`)}window.swapBackground=S;const M={menubackground:{kids:"#ff77ff",quick:"#00ffee",tips:"#ffee00",story:"#ff4488",infinity:"#88ccff",options:"#cccccc"},spring:{kids:"#cc66ff",quick:"#00cc99",tips:"#ffcc66",story:"#ff66aa",infinity:"#66ddff",options:"#9999cc"},summer:{kids:"#ffdd00",quick:"#ff6600",tips:"#33cc33",story:"#ff3399",infinity:"#00ddff",options:"#ff9933"},fall:{kids:"#ffaa00",quick:"#ff6600",tips:"#66cc33",story:"#cc6633",infinity:"#ffffff",options:"#663300"},winter:{kids:"#aaddff",quick:"#ffffff",tips:"#66ffff",story:"#ddddff",infinity:"#66ccff",options:"#ccccff"},freedom:{kids:"#ff4444",quick:"#ffffff",tips:"#3366ff",story:"#ffcc00",infinity:"#bbbbbb",options:"#222222"},halloween:{kids:"#ff9933",quick:"#6600cc",tips:"#00cc66",story:"#cc0000",infinity:"#dddddd",options:"#000000"},harvest:{kids:"#ffcc00",quick:"#996633",tips:"#cc9900",story:"#993300",infinity:"#ffffff",options:"#333300"},christmas:{kids:"#00dd00",quick:"#dd0000",tips:"#ffffff",story:"#ff66cc",infinity:"#aaaaaa",options:"#006600"},newyear:{kids:"#ffffff",quick:"#ffcc00",tips:"#999999",story:"#330066",infinity:"#ff00ff",options:"#111111"},valentine:{kids:"#ff6699",quick:"#cc0066",tips:"#ffcccc",story:"#990033",infinity:"#ffe6f0",options:"#660033"},cosmic_01:{kids:"#cc66ff",quick:"#00ffff",tips:"#ffcc00",story:"#ff6699",infinity:"#ffffff",options:"#9999ff"},cosmic_02:{kids:"#ff99cc",quick:"#33ccff",tips:"#ccff66",story:"#ff66cc",infinity:"#cccccc",options:"#6666ff"},cosmic_03:{kids:"#ffffff",quick:"#88ffcc",tips:"#00cc99",story:"#66ccff",infinity:"#ccffff",options:"#333399"},cosmic_04:{kids:"#aaffff",quick:"#ffffff",tips:"#66ccff",story:"#99ccff",infinity:"#33ccff",options:"#005577"},cosmic_05:{kids:"#ffcc00",quick:"#ff9900",tips:"#00ffff",story:"#ff33cc",infinity:"#ffffff",options:"#ff0066"},cosmic_06:{kids:"#000000",quick:"#ff0000",tips:"#ffccff",story:"#330033",infinity:"#ff99ff",options:"#9900cc"},cosmic_07:{kids:"#ffffff",quick:"#ffffff",tips:"#ffffff",story:"#ffffff",infinity:"#ffffff",options:"#ffffff"}},u={menubackground:"🌌 Default",fall:"🍂 Fall",winter:"❄️ Winter",spring:"🌸 Spring",summer:"☀️ Summer",halloween:"🎃 Halloween",harvest:"🌽 Harvest",christmas:"🎄 Christmas",freedom:"🎆 Freedom",newyear:"🎊 New Year",valentine:"💘 Valentine",cosmic_01:"🌀 Cosmic 01",cosmic_02:"🌀 Cosmic 02",cosmic_03:"🌀 Cosmic 03",cosmic_04:"🌀 Cosmic 04",cosmic_05:"🌀 Cosmic 05",cosmic_06:"🌀 Cosmic 06",cosmic_07:"🌀 Abery’s Cone"};window.setTheme=e=>{f("theme",e),y()};function k(){const e=document.getElementById("infoModal");e&&(e.classList.remove("hidden"),e.style.display="flex")}function h(){const e=document.getElementById("infoModal");e&&(e.classList.add("hidden"),e.style.display="none")}document.addEventListener("DOMContentLoaded",()=>{const e=document.querySelector(".menu-title-top");e?(console.log("🎯 Title found. Binding click."),e.addEventListener("click",()=>{console.log("🎯 Title click detected"),k()})):console.warn("⚠️ .menu-title-top not found!")});document.addEventListener("keydown",e=>{e.key==="Escape"&&h()});console.log("🍧 infoModal.js loaded");window.openInfoModal=k;window.closeInfoModal=h;const C={first_steps:{label:"🍦 First Steps"},math_zen:{label:"🧘 Math Zen"},quick_master:{label:"⚡ QuickServe Master"},full_clear:{label:"🌈 100% Cleared"},legend:{label:"🏆 Cone Legend"}};function I(){const e=document.getElementById("badgeGrid"),t=c();e&&(e.innerHTML="",Object.entries(C).forEach(([n,s])=>{const o=document.createElement("div");o.classList.add("badge-tile"),t.profile.badges.includes(n)?(o.classList.add("unlocked"),o.textContent=s.label):o.textContent="🔒",e.appendChild(o)}))}function q(){return`
    <div class="settings-block">
      <label for="profileNameInput">🧑‍🚀 Your Name:</label>
      <input id="profileNameInput" type="text" placeholder="Enter name..." />
    </div>

    <div class="settings-block">
      <h3>📈 Completion</h3>
      <div class="xp-bar-wrap">
        <div class="xp-bar" id="xpBar"></div>
      </div>
      <span id="xpPercentText">0%</span>
    </div>

    <div class="settings-block">
      <h3>🏅 Cones Earned</h3>
      <div id="badgeGrid" class="badge-grid"></div>
    </div>

    <div class="settings-block">
      <h3>📲 App Info</h3>
      <p>This app works offline after install!<br>To save your data, don’t clear site storage.</p>
      <p>If you want to install as an app:<br>Look for the browser’s install option or PWA banner.</p>
    </div>
  `}function B(){const e=Math.min(100,L()),t=document.getElementById("xpBar"),n=document.getElementById("xpPercentText");t&&(t.style.width=`${e}%`,t.style.transition="width 0.5s ease-in-out"),n&&(n.textContent=`${e}%`)}function _(){const e=document.getElementById("profileNameInput");e&&(e.value=c().profile.username,e.addEventListener("change",()=>{const t=c();t.profile.username=e.value.trim(),g(t)})),B(),I()}function P(){var o;const e=c(),t=e.settings.theme,n=((o=e.profile)==null?void 0:o.unlockedThemes)||[];let s='<div class="theme-grid">';return Object.keys(u).forEach(i=>{const l=u[i],d=i==="menubackground"||n.includes(i);s+=`
      <div class="theme-tile ${d?"":"locked"} ${t===i?"active":""}" data-theme="${i}">
        <div class="theme-preview" style="background-image:url('assets/img/branding/${i}.png')"></div>
        <div class="theme-label">${l}</div>
        ${d?"":'<div class="theme-lock">🔒</div>'}
      </div>
    `}),s+="</div>",s}function O(){const e=document.querySelectorAll(".theme-tile");if(!e.length){console.warn("🌀 No theme tiles found to bind");return}e.forEach(t=>{t.classList.contains("locked")||t.addEventListener("click",()=>{const n=t.dataset.theme;console.log(`🎨 Theme selected: ${n}`),f("theme",n),location.reload()})})}const $=[{id:"infinity_addition",label:"♾️ Infinity Addition",src:"assets/audio/infinityaddition.mp3"}];let a=null;function x(){return`
    <div class="settings-block">
      <label>
        <input type="checkbox" id="muteToggle" ${b("mute")?"checked":""} />
        🔇 Mute all sound
      </label>
    </div>

    <div class="settings-block">
      <h3>🎧 Tracks</h3>
      <div class="track-list">
        ${$.map(t=>`
          <button class="track-button" data-src="${t.src}">${t.label}</button>
        `).join("")}
      </div>
    </div>
  `}function A(){const e=document.getElementById("muteToggle");e&&e.addEventListener("change",()=>{const n=e.checked;f("mute",n),a&&(a.volume=n?0:1)}),document.querySelectorAll(".track-button").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.src;a&&(a.pause(),a=null),a=new Audio(s),a.loop=!0,a.volume=b("mute")?0:1,a.play().catch(o=>{console.warn("🎧 Playback failed:",o)})})})}function D(){var n;const e=((n=window==null?void 0:window.devFlags)==null?void 0:n.build)||"unknown",t=c();return JSON.stringify(t,null,2),`
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.1.9</h3>
      <p><strong>Build:</strong> <code>${e}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>📝 Changelog</h3>
      <p>- Added modal tab system<br>
         - Profile, Themes, and Music tab now working<br>
         - Cosmic background persistence improved</p>
    </div>

    <div class="settings-block">
      <h3>🧰 Tools</h3>
      <button class="track-button" id="downloadSave">⬇️ Download Save</button>
      <button class="track-button" id="resetProgress">🗑️ Reset Progress</button>
    </div>
  `}function N(){const e=document.getElementById("downloadSave"),t=document.getElementById("resetProgress");e&&e.addEventListener("click",()=>{const n=new Blob([JSON.stringify(c(),null,2)],{type:"application/json"}),s=URL.createObjectURL(n),o=document.createElement("a");o.href=s,o.download="snowcone_save_data.json",o.click(),URL.revokeObjectURL(s)}),t&&t.addEventListener("click",()=>{confirm("Reset all progress? This cannot be undone.")&&(localStorage.clear(),location.reload())})}function v(e="profile"){const t=document.getElementById("cosmicModal");if(!t)return console.warn("🛑 cosmicModal not found");t.classList.remove("hidden"),E(e);const n=document.querySelector(".modal-close");n==null||n.addEventListener("click",()=>{console.log("❌ Closing modal from inside openModal"),w()})}function w(){const e=document.getElementById("cosmicModal");e&&e.classList.add("hidden")}function E(e){const t=document.getElementById("modalContent");if(!t)return;switch(document.querySelectorAll(".tab-button").forEach(s=>{s.classList.toggle("active",s.dataset.tab===e)}),e){case"profile":t.innerHTML=q(),_();break;case"themes":t.innerHTML=P(),O();break;case"music":t.innerHTML=x(),A();break;case"version":t.innerHTML=D(),N();break;default:t.innerHTML=`<p>Unknown tab: ${e}</p>`;break}const n=document.querySelector(".modal-close");n&&n.addEventListener("click",()=>{console.log("❌ Cosmic modal closing!"),w()})}function j(e){const t=e.currentTarget.dataset.tab;console.log(`🪐 Tab clicked: ${t}`),E(t)}function U(){var e;console.log("🧪 Setting up tab listeners..."),document.querySelectorAll(".tab-button").forEach(t=>{t.addEventListener("click",j)}),(e=document.querySelector(".label-options"))==null||e.addEventListener("click",()=>{console.log("⚙️ Options clicked – opening modal"),v("profile")})}document.addEventListener("DOMContentLoaded",()=>{U(),console.log("🧊 Cosmic modal listeners wired.")});window.openModal=v;let m=0;document.addEventListener("touchend",e=>{const t=new Date().getTime();t-m<=300&&e.preventDefault(),m=t},!0);document.addEventListener("gesturestart",e=>{e.preventDefault()});console.log("🔐 VITE_SECRET_KEY:","radical123");document.addEventListener("DOMContentLoaded",()=>{y()});
