(() => {
  'use strict';
  const {questions, sources} = window.FOOD_QUIZ;
  const $ = selector => document.querySelector(selector);
  const el = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  let index=0, picked=null, locked=false, records=[], attemptId=null, participantCode=null, saving=false, saved=false;
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
  function start(){if(saving)return;index=0;records=[];attemptId=crypto.randomUUID();saved=false;$('#save-status').textContent='尚未提交。仅在你勾选同意并点击提交后，才会上传本轮成绩。';$('#save-score').disabled=false;$('#save-score').textContent='提交本轮成绩';$('#consent').checked=false;$('#consent').disabled=false;$('#nickname').value='';$('#nickname').disabled=false;window.dispatchEvent(new Event('quiz-started'));screen('play');drawQuestion();}
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
  $('#score-form').addEventListener('submit',async(event)=>{
    event.preventDefault();if(saving||saved||records.length!==questions.length)return;if(location.protocol==='file:'){$('#save-status').textContent='离线副本仅用于练习。请打开在线测验链接提交成绩：https://djzkqb.github.io/campus-raw-food-quiz/';return;}
    if(!$('#consent').checked){$('#save-status').textContent='请先阅读说明并勾选同意。也可以不提交，继续阅读解析。';$('#consent').focus();return;}
    saving=true;$('#save-score').disabled=true;$('#restart').disabled=true;$('#save-status').textContent='正在保存，请保持页面打开……';
    if(!participantCode){try{participantCode=localStorage.getItem('raw-food-participant-v1');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(participantCode||'')){participantCode=crypto.randomUUID();localStorage.setItem('raw-food-participant-v1',participantCode);}}catch{participantCode=crypto.randomUUID();}}
    const data={attemptId,participantCode,quizVersion:window.SCORE_CONFIG.quizVersion,consent:true,nickname:$('#nickname').value.trim(),answers:records.map(r=>r.picked)};
    const post=async(path,payload)=>{const response=await fetch(window.SCORE_CONFIG.api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000),credentials:'omit'});let result;try{result=await response.json();}catch{throw Error('成绩服务暂时无法访问');}if(!response.ok)throw Error(result.error||'提交未完成');return result;};
    try{const session=await post('/session',data),receipt=await post('/attempts',{...data,token:session.token});if(!receipt.saved||receipt.receipt!==attemptId)throw Error('未收到保存回执');window.dispatchEvent(new CustomEvent('quiz-score-saved',{detail:{attemptId,participantCode,nickname:data.nickname}}));saved=true;$('#save-score').textContent='已保存';$('#consent').disabled=true;$('#nickname').disabled=true;$('#save-status').textContent=`已保存 · ${receipt.score} 分 · ${new Date(receipt.createdAt).toLocaleString('zh-CN')}。回执：${receipt.receipt}。可截图保存，用于向活动负责人申请删除。`;}
    catch(error){$('#save-status').textContent=`未确认保存成功：${error.name==='TimeoutError'?'连接超时':error.message}。请保持本页并重试；同一轮重试不会重复计入。`;$('#save-score').disabled=false;$('#save-score').textContent='重试提交本轮成绩';}
    finally{saving=false;$('#restart').disabled=false;}
  });
  $('#next').addEventListener('click',()=>{if(!locked)return;if(index===questions.length-1)results();else {index++;drawQuestion();}});
  $('#copy-link').addEventListener('click',async()=>{const url=location.protocol.startsWith('http')?new URL('./',location.href).href:'https://djzkqb.github.io/campus-raw-food-quiz/';try{await Promise.race([navigator.clipboard.writeText(url),new Promise((_,reject)=>setTimeout(()=>reject(new Error('clipboard timeout')),1500))]);$('#copy-status').textContent='链接已复制，可以分享给同学。';}catch{$('#copy-status').textContent='请复制这个链接：'+url;}});
})();
