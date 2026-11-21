(() => {
  'use strict';
  const {questions, sources} = window.FOOD_QUIZ;
  const $ = selector => document.querySelector(selector);
  const el = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  let index=0, picked=null, locked=false, records=[];
  function shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function refs(ids){const row=el('div','source-links');row.append(el('span','','依据：'));for(const id of ids){const s=sources.find(x=>x.id===id),a=el('a','',`[${id}] ${s.name}`);a.href=s.url;a.target='_blank';a.rel='noopener';row.append(a);}return row;}
  function screen(id){for(const name of ['welcome','play','result'])$('#'+name).hidden=name!==id;window.scrollTo({top:0,behavior:'instant'});}
  function drawQuestion(){
    picked=null;locked=false;const q=questions[index];
    $('#position').textContent=`第 ${index+1} / ${questions.length} 题`;
    $('#topic').textContent=q.topic;$('#question').textContent=q.q;
    $('#progress').setAttribute('aria-valuenow',index);$('#progress-fill').style.width=`${index/questions.length*100}%`;
    $('#options').replaceChildren();shuffle(q.options.map((_,i)=>i)).forEach((original,i)=>{
      const b=el('button','option');b.type='button';b.dataset.option=original;b.setAttribute('aria-pressed','false');b.append(el('span','option-letter',String.fromCharCode(65+i)),el('span','option-text',q.options[original]));
      b.addEventListener('click',()=>{if(locked)return;picked=original;$('#options').querySelectorAll('button').forEach(x=>{const yes=Number(x.dataset.option)===picked;x.classList.toggle('selected',yes);x.setAttribute('aria-pressed',String(yes));});$('#submit').disabled=false;$('#selection-hint').textContent='选好后点击“确认答案”';});
      $('#options').append(b);
    });
    $('#submit').disabled=true;$('#submit').hidden=false;$('#selection-hint').textContent='请选择一个答案';$('#feedback').hidden=true;$('#feedback').replaceChildren();$('#next').hidden=true;$('#question').focus();
  }
  function start(){index=0;records=[];screen('play');drawQuestion();}
  function submit(){
    if(locked||picked===null)return;locked=true;const q=questions[index],ok=picked===q.answer;
    records.push({id:q.id,picked,ok});
    $('#options').querySelectorAll('button').forEach(b=>{b.disabled=true;const n=Number(b.dataset.option);if(n===q.answer)b.classList.add('correct');else if(n===picked)b.classList.add('wrong');});
    $('#submit').hidden=true;$('#selection-hint').textContent='本题已作答';
    const f=$('#feedback');f.className='feedback '+(ok?'positive':'negative');f.append(el('h2','',ok?'答对了，这个知识点掌握了':'这题值得再看一眼'),el('p','correct-answer','正确答案：'+q.options[q.answer]),el('p','',q.why),refs(q.refs));f.hidden=false;
    $('#next').textContent=index===questions.length-1?'查看本轮成绩':'下一题';$('#next').hidden=false;
    $('#progress').setAttribute('aria-valuenow',index+1);$('#progress-fill').style.width=`${(index+1)/questions.length*100}%`;
  }
  function results(){
    const correct=records.filter(r=>r.ok).length;screen('result');$('#score-number').textContent=correct*10;
    $('#result-title').textContent=correct===10?'10 个知识点，全部答对！':correct>=7?'已经掌握不少，再巩固几处':'每一次纠正，都是收获';
    $('#result-description').textContent=`本轮答对 ${correct} / ${questions.length} 题。${correct===10?'把这些提醒带到下一次点餐和备餐中吧。':'下方已整理每题解析，看看哪些认知需要更新。'}`;
    $('#review').replaceChildren();$('#copy-status').textContent='';
    records.forEach((r,i)=>{const q=questions[i],d=el('details','review-item '+(r.ok?'passed':'missed'));d.open=!r.ok;const s=el('summary');s.append(el('span','review-status',r.ok?'答对':'待巩固'),el('span','',`${i+1}. ${q.q}`));d.append(s,el('p','your-answer','你的答案：'+q.options[r.picked]),el('p','correct-answer','正确答案：'+q.options[q.answer]),el('p','',q.why),refs(q.refs));const a=el('a','learn-link',`回读知识点 ${q.id}`);a.href=`article.html#topic${q.id}`;d.append(a);$('#review').append(d);});
    $('#result-title').focus();
  }
  $('#start').addEventListener('click',start);$('#restart').addEventListener('click',start);$('#submit').addEventListener('click',submit);
  $('#next').addEventListener('click',()=>{if(!locked)return;if(index===questions.length-1)results();else {index++;drawQuestion();}});
  $('#copy-link').addEventListener('click',async()=>{const url=location.protocol.startsWith('http')?new URL('./',location.href).href:'https://djzkqb.github.io/campus-raw-food-quiz/';try{await Promise.race([navigator.clipboard.writeText(url),new Promise((_,reject)=>setTimeout(()=>reject(new Error('clipboard timeout')),1500))]);$('#copy-status').textContent='链接已复制，可以分享给同学。';}catch{$('#copy-status').textContent='请复制这个链接：'+url;}});
})();
