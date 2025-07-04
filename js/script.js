const NUM_TONES = 10;
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
let tones = [];
let mixerStarted = false;

function getControlValues(){
  const values=[];
  for(let i=0;i<NUM_TONES;i++){
    const freq=document.getElementById(`freq-${i}`)?.value||0;
    const vol=document.getElementById(`vol-${i}`)?.value||0.1;
    const wave=document.getElementById(`wave-${i}`)?.value||'sine';
    values.push({freq,vol,wave});
  }
  return values;
}

function initControls(presetValues=null){
  const container=document.getElementById('toneContainer');
  container.innerHTML='';
  const topRow=document.createElement('div');topRow.className='controls-row';
  const bottomRow=document.createElement('div');bottomRow.className='controls-row';
  const solfeggio=[174,285,396,417,528,639,741,852,963,0];
  for(let i=0;i<NUM_TONES;i++){
    const values=presetValues?presetValues[i]:{freq:solfeggio[i],vol:0.1,wave:'sine'};
    const div=document.createElement('div');div.className='tone';
    div.innerHTML=`<label>Tone ${i+1} Frequency (Hz)</label>
      <input type="number" id="freq-${i}" value="${values.freq}">
      <label>Tone ${i+1} Volume</label>
      <input type="range" id="vol-${i}" min="0" max="1" step="0.01" value="${values.vol}">
      <label>Tone ${i+1} Waveform</label>
      <select id="wave-${i}">
        ${['sine','square','triangle','sawtooth'].map(t=>`<option value="${t}" ${t===values.wave?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
      </select>
      <button id="pause-${i}" disabled>Pause/Resume</button>`;
    (i<5?topRow:bottomRow).appendChild(div);
  }
  container.appendChild(topRow);
  container.appendChild(bottomRow);
}

function startAudio(){
  if(mixerStarted)return;
  mixerStarted=true;
  tones=[];
  for(let i=0;i<NUM_TONES;i++){
    const freqInput=document.getElementById(`freq-${i}`);
    const volInput=document.getElementById(`vol-${i}`);
    const waveSelect=document.getElementById(`wave-${i}`);
    const pauseBtn=document.getElementById(`pause-${i}`);
    if(!freqInput||!volInput||!pauseBtn||!waveSelect)continue;
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    const dummyGain=audioCtx.createGain();
    osc.type=waveSelect.value;
    osc.frequency.value=parseFloat(freqInput.value);
    gain.gain.value=parseFloat(volInput.value);
    osc.connect(gain).connect(dummyGain).connect(audioCtx.destination);
    osc.start();
    tones.push({osc,gain,dummyGain,playing:true});
    freqInput.oninput=e=>osc.frequency.value=parseFloat(e.target.value);
    volInput.oninput=e=>gain.gain.value=parseFloat(e.target.value);
    waveSelect.onchange=e=>osc.type=e.target.value;
    pauseBtn.onclick=()=>toggleTone(i);
    pauseBtn.disabled=false;
  }
}

function stopAllAudio(){
  tones.forEach(t=>{try{t.osc.stop()}catch{}});
  const current=getControlValues();
  tones=[];mixerStarted=false;initControls(current);
}

function toggleTone(i){
  const t=tones[i];if(!t)return;
  t.playing=!t.playing;t.dummyGain.gain.value=t.playing?1:0;
  const card=document.getElementsByClassName('tone')[i];
  if(t.playing){card.style.opacity='1';card.style.background='var(--card-bg)';card.classList.add('playing')}
  else{card.style.opacity='0.5';card.style.background='var(--paused-bg)';card.classList.remove('playing')}
}

window.addEventListener('DOMContentLoaded',()=>{
  if(!localStorage.getItem('disclaimerSeen')){
    document.querySelector('details').setAttribute('open','true');
    localStorage.setItem('disclaimerSeen','true');
  }
  document.getElementById('resetBtn').onclick=()=>{tones.forEach(t=>{try{t.osc.stop()}catch{}});tones=[];mixerStarted=false;initControls();};
  initControls();
  document.getElementById('startBtn').onclick=startAudio;
  document.getElementById('stopBtn').onclick=stopAllAudio;
});
