const $=id=>document.getElementById(id);

function load(){
  chrome.storage.local.get({hq:true,watermark:false}, v=>{
    $("hq").checked=v.hq;
    $("watermark").checked=v.watermark;
  });
}
function save(){
  chrome.storage.local.set({hq:$("hq").checked,watermark:$("watermark").checked});
}
$("hq").addEventListener("change",save);
$("watermark").addEventListener("change",save);

function openProfile(){
  chrome.tabs.create({url:"https://www.tiktok.com/@flavox.3dits"});
}
$("tiktok").onclick=openProfile;
$("profileBtn").onclick=openProfile;

$("open").onclick=()=>{
  chrome.tabs.create({url:"https://www.tiktok.com/tiktokstudio/upload"}, tab=>{
    if(tab?.id){
      setTimeout(()=>chrome.tabs.sendMessage(tab.id,{type:"FLAVOX_SHOW_ISLAND"}).catch(()=>{}),900);
    }
  });
};
load();