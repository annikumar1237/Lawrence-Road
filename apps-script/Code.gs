/** Read-only attendance dashboard. No triggers, writes, salary or location fields. */
const ATTENDANCE_SHEET_ID = '1YKP9D35pNQNdvYf786e5srx7JyFUcExMeysqVz7C-Qo';
function doGet() {
  return HtmlService.createHtmlOutput("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>My attendance | Siddhi Cold Chain</title>\n<style>*{box-sizing:border-box}body{margin:0;padding:24px;font:14px system-ui,sans-serif;color:#18334b;background:#fff}h1{font-size:24px;margin:0 0 8px;letter-spacing:-.5px}h2{font-size:19px;margin:8px 0}p{color:#607385;line-height:1.7}.eyebrow{color:#087969;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px}.row{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:20px 0}label{display:grid;gap:7px;font-weight:600;flex:1;min-width:170px}input,select,button{font:inherit;padding:12px;border:1px solid #cbd8e2;border-radius:8px;min-height:44px}input,select{width:100%;background:white;color:inherit}input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #8ad0e7;outline-offset:2px}button{background:#086b9a;color:white;font-weight:600;cursor:pointer}button:disabled{opacity:.6;cursor:wait}button.secondary{background:white;color:#086b9a}small{font-weight:400;color:#708194;line-height:1.5}.hint{background:#f3f7fa;border-radius:10px;padding:14px 16px;margin:16px 0;font-size:12px}#message{padding:12px;background:#f0f5f8;border-radius:8px;overflow-wrap:anywhere}#message.error{background:#fff2ee;color:#a73922}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:20px 0}.stat{background:#f3f7fa;border:1px solid #e1e9ef;padding:16px;border-radius:10px}.stat strong{display:block;font-size:24px;color:#086b9a}.stat span{font-size:12px;color:#607385}.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:13px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #e1e9ef}th{background:#f3f7fa;color:#425b70}caption{text-align:left;padding:18px 0;font-weight:700;font-size:16px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.secure{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #e1e9ef}.secure span{color:#087969;font-size:12px}.secure button{padding:8px 12px;min-height:36px;font-size:12px}[hidden]{display:none!important}@media(max-width:480px){body{padding:18px}.row>*{width:100%}.stats{grid-template-columns:1fr 1fr}}@media print{#auth,#lookup,.actions,#message,.secure{display:none}body{padding:0}.scroll{overflow:visible}table{white-space:normal}}</style></head><body>\n<div class=\"eyebrow\">Employee self service</div><h1>My attendance dashboard</h1><p>View your monthly IN / OUT, working hours and leave requests.</p>\n<section id=\"auth\"><form id=\"login\"><div class=\"row\"><label>Registered email<input id=\"email\" type=\"email\" required autocomplete=\"email\" placeholder=\"Your registered email\"></label><label>Date of birth <small>Optional \u2014 leave blank for email OTP</small><input id=\"dob\" type=\"date\" autocomplete=\"bday\"></label></div><button id=\"continue\" type=\"submit\">Continue</button></form><p class=\"hint\">Email + registered date of birth \u2192 open directly.<br>Email only \u2192 verify the OTP sent to your registered email.</p><form id=\"otpForm\" hidden><div class=\"row\"><label>Email OTP<input id=\"otp\" type=\"text\" inputmode=\"numeric\" autocomplete=\"one-time-code\" pattern=\"[0-9]{6}\" maxlength=\"6\" required placeholder=\"6-digit code\"></label><button id=\"verify\" type=\"submit\">Verify & open</button></div><button id=\"resend\" type=\"button\" class=\"secondary\">Resend OTP</button></form></section>\n<div id=\"message\" role=\"status\" aria-live=\"polite\">Sign in to view your attendance.</div>\n<section id=\"dashboard\" hidden><div class=\"secure\"><span>\u2713 Verified \u00b7 Session valid for 30 minutes</span><button type=\"button\" class=\"secondary\" id=\"logout\">Sign out</button></div><form id=\"lookup\" class=\"row\"><label>Month<select id=\"month\" required><option value=\"\">Loading months\u2026</option></select></label><button id=\"show\" disabled>Show report</button></form><section id=\"result\" hidden><h2 id=\"employee\"></h2><p id=\"period\"></p><div id=\"stats\" class=\"stats\"></div><div class=\"actions\"><button type=\"button\" class=\"secondary\" id=\"csv\">Download CSV</button><button type=\"button\" class=\"secondary\" id=\"print\">Print / Save PDF</button></div><div class=\"scroll\"><table><caption>Daily attendance</caption><thead><tr><th>Date</th><th>Day</th><th>IN</th><th>OUT</th><th>Hours</th><th>Attendance status</th><th>Leave request</th></tr></thead><tbody id=\"days\"></tbody></table></div><div class=\"scroll\"><table><caption>Leave requests for this month</caption><thead><tr><th>From</th><th>To</th><th>Approval status</th></tr></thead><tbody id=\"leaves\"></tbody></table></div><p>Times and hours match the monthly sheet. Pending or untracked leave requests are shown separately. Future dates are marked Upcoming.</p></section></section>\n<script>\nconst $=id=>document.getElementById(id);let token='',challenge='',report=null,sessionTimer=null,resendTimer=null;\nconst esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\nfunction rpc(method,...args){return new Promise((resolve,reject)=>{google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args);});}\nfunction message(text,error=false){$('message').textContent=text;$('message').className=error?'error':'';}\nfunction busy(value){['continue','verify','show'].forEach(id=>$(id).disabled=value);}\nfunction fail(err){busy(false);message(err.message||'Something went wrong. Please try again.',true);}\nfunction otpCooldown(){clearInterval(resendTimer);let left=60;$('resend').disabled=true;$('resend').textContent='Resend in '+left+'s';resendTimer=setInterval(()=>{left--;$('resend').textContent=left?'Resend in '+left+'s':'Resend OTP';if(!left){clearInterval(resendTimer);$('resend').disabled=false;}},1000);}\nasync function sendOtp(){const data=await rpc('attendanceSendOtp',$('email').value.trim());challenge=data.challenge;$('otp').value='';$('otpForm').hidden=false;message(data.message);otpCooldown();$('otp').focus();}\nasync function signedIn(data){token=data.token;challenge='';$('dob').value='';$('otp').value='';$('auth').hidden=true;$('otpForm').hidden=true;$('dashboard').hidden=false;clearTimeout(sessionTimer);sessionTimer=setTimeout(()=>signOut('Your session expired. Please sign in again.'),data.expiresIn*1000);message('Loading available months\u2026');try{const months=await rpc('attendanceMonths');$('month').innerHTML=months.map(m=>'<option value=\"'+esc(m.key)+'\">'+esc(m.label)+'</option>').join('');if(!months.length)throw new Error('No monthly attendance sheets are available.');await loadReport();}catch(err){fail(err);}}\n$('login').addEventListener('submit',async e=>{e.preventDefault();busy(true);$('otpForm').hidden=true;message('Verifying your details\u2026');try{if($('dob').value)await signedIn(await rpc('attendanceLoginDob',$('email').value.trim(),$('dob').value));else await sendOtp();}catch(err){fail(err);}finally{busy(false);}});\n$('email').addEventListener('input',()=>{challenge='';$('otpForm').hidden=true;$('otp').value='';});$('dob').addEventListener('input',()=>{challenge='';$('otpForm').hidden=true;});\n$('otpForm').addEventListener('submit',async e=>{e.preventDefault();busy(true);try{await signedIn(await rpc('attendanceVerifyOtp',challenge,$('otp').value));}catch(err){fail(err);}finally{busy(false);}});\n$('resend').onclick=async()=>{busy(true);try{await sendOtp();}catch(err){fail(err);}finally{busy(false);}};\nasync function loadReport(){if(!token)return;report=null;$('result').hidden=true;$('show').disabled=true;message('Loading your attendance\u2026');try{const data=await rpc('attendanceReport',token,$('month').value);report=data;$('employee').textContent=data.name;$('period').textContent=data.monthLabel+' \u00b7 '+data.email;$('stats').innerHTML=[['Present days',data.summary.present],['Absent days',data.summary.absent],['Leave days',data.summary.leave],['Weekly off days',data.summary.off],['Missing punches',data.summary.missing],['Working hours',data.summary.hours]].map(([label,value])=>'<div class=\"stat\"><strong>'+esc(value)+'</strong><span>'+label+'</span></div>').join('');$('days').innerHTML=data.days.map(d=>'<tr>'+[d.date,d.day,d.in,d.out,d.hours,d.status,d.leave].map(v=>'<td>'+esc(v||'\u2014')+'</td>').join('')+'</tr>').join('');$('leaves').innerHTML=data.leaves.length?data.leaves.map(l=>'<tr>'+[l.from,l.to,l.status].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan=\"3\">No leave requests in this month.</td></tr>';$('result').hidden=false;message('Report updated '+data.updated+' (India time).');}catch(err){if(/session expired|sign in/i.test(err.message||''))signOut('Your session expired. Please sign in again.');else fail(err);}finally{$('show').disabled=false;}}\n$('lookup').addEventListener('submit',e=>{e.preventDefault();loadReport();});\nfunction signOut(text='Signed out. Enter your details to view attendance.'){const old=token;token='';challenge='';report=null;clearTimeout(sessionTimer);clearInterval(resendTimer);$('dashboard').hidden=true;$('result').hidden=true;$('auth').hidden=false;$('dob').value='';$('otp').value='';['days','leaves','stats','employee','period'].forEach(id=>$(id).textContent='');message(text);if(old)rpc('attendanceLogout',old).catch(()=>{});}\n$('logout').onclick=()=>signOut();$('print').onclick=()=>window.print();$('csv').onclick=()=>{if(!report)return;const safe=v=>'\"'+String(v??'').replace(/^[=+@-]/,\"'$&\").replace(/\"/g,'\"\"')+'\"';const rows=[['Date','Day','IN','OUT','Working hours','Attendance status','Leave request'],...report.days.map(d=>[d.date,d.day,d.in,d.out,d.hours,d.status,d.leave])];const url=URL.createObjectURL(new Blob(['\\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\\r\\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='attendance-'+report.month+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};\n</script></body></html>\n").setTitle('My attendance | Siddhi Cold Chain').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport','width=device-width, initial-scale=1');
}
function attendanceBook_(){return SpreadsheetApp.openById(ATTENDANCE_SHEET_ID);}
function attendanceDate_(value){
  if(value instanceof Date && !isNaN(value)) return Utilities.formatDate(value,'Asia/Kolkata','yyyy-MM-dd');
  const s=String(value||'').trim();let m=s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if(m){const n=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].toLowerCase())+1;return n?m[3]+'-'+String(n).padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';}
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');
  return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
}
function attendanceCatalog_(ss){
  const cache=CacheService.getScriptCache(),cached=cache.get("monthCatalog");if(cached)return JSON.parse(cached);
  const list=[];
  ss.getSheets().forEach(sh=>{
    if(!/^(January|February|March|April|May|June|July|August|September|October|November|December)(\s+\d{4})?\s*$/i.test(sh.getName()))return;
    const n=Math.min(sh.getLastColumn(),250);if(n<8)return;
    const headers=sh.getRange(1,1,2,n).getDisplayValues(),groups=[];
    for(let c=0;c<n;c++)if(/^in$/i.test(headers[1][c].trim())){
      let date='';for(let j=c;j<Math.min(c+5,n);j++){date=attendanceDate_(headers[0][j]);if(date)break;}
      if(date)groups.push({column:c,date:date});
    }
    if(!groups.length)return;
    const key=groups[0].date.slice(0,7);const emailColumn=headers[1].findIndex(h=>/^email\s*(id|address)?$/i.test(h.trim()));
    if(emailColumn<0)return;
    list.push({key:key,label:sh.getName().trim()+' '+key.slice(0,4),sheet:sh.getName(),emailColumn:emailColumn,groups:groups.filter(g=>g.date.slice(0,7)===key),width:n});
  });
  list.sort((a,b)=>b.key.localeCompare(a.key));
  cache.put("monthCatalog",JSON.stringify(list),300);return list;
}
function attendanceMonths(){return attendanceCatalog_(attendanceBook_()).map(m=>({key:m.key,label:m.label}));}
function attendanceReport(token,month){
  const email=attendanceSessionEmail_(token);
  return attendanceReport_(email,month);
}
function attendanceReport_(email,month){
  email=String(email||'').trim().toLowerCase();month=String(month||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Please enter a valid registered email.');
  if(!/^\d{4}-\d{2}$/.test(month))throw new Error('Please choose a month.');
  const ss=attendanceBook_(),meta=attendanceCatalog_(ss).find(m=>m.key===month);if(!meta)throw new Error('Attendance is not available for this month.');
  const sh=ss.getSheetByName(meta.sheet),last=sh.getLastRow();
  const hit=last>=3?sh.getRange(3,meta.emailColumn+1,last-2,1).createTextFinder(email).matchEntireCell(true).matchCase(false).useRegularExpression(false).findNext():null;
  if(!hit)throw new Error('This email was not found in the selected month. Check your registered email or choose another month.');
  const row=sh.getRange(hit.getRow(),1,1,meta.width).getDisplayValues()[0];
  const today=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');
  const leaveSheet=ss.getSheetByName('Leave');const leaves=[];
  if(leaveSheet&&leaveSheet.getLastRow()>1){
    const data=leaveSheet.getRange(2,1,leaveSheet.getLastRow()-1,10).getValues();
    data.forEach(r=>{if(String(r[2]).trim().toLowerCase()!==email)return;const from=attendanceDate_(r[3]),to=attendanceDate_(r[4]);if(!from||!to||from>month+'-31'||to<month+'-01')return;const raw=String(r[7]||'').trim();leaves.push({from:from,to:to,status:raw||'Not tracked'});});
  }
  const summary={present:0,absent:0,leave:0,off:0,missing:0,hours:'00:00'};let minutes=0;
  const isTime=v=>/^\d{1,2}:\d{2}/.test(String(v).trim());
  const days=meta.groups.map(g=>{
    const c=g.column,clockIn=row[c]||'',clockOut=row[c+1]||'',hours=row[c+2]||'',raw=row[c+3]||'';
    const requests=leaves.filter(l=>l.from<=g.date&&l.to>=g.date);const approved=requests.some(l=>/^approved$/i.test(l.status));
    const off=/^(w\/?o|weekly off)$/i.test(clockIn.trim())||/weekly off/i.test(raw);
    const present=isTime(clockIn)||isTime(clockOut)||/^present/i.test(raw);
    let status=raw||'No attendance recorded';
    if(g.date>today)status='Upcoming';
    else {
      if(present){summary.present++;if(!isTime(clockIn)||!isTime(clockOut)){summary.missing++;status=(raw||'Present')+' · Missing '+(!isTime(clockIn)?'IN':'OUT');}}
      else if(approved){summary.leave++;status='Approved leave';}
      else if(off){summary.off++;status='Weekly off';}
      else if(/leave/i.test(raw)&&!/pending|rejected/i.test(raw)){status=raw;summary.leave++;}
      else if(/absent/i.test(raw)){summary.absent++;}
      const hm=hours.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);if(hm&&present)minutes+=Number(hm[1])*60+Number(hm[2])+Number(hm[3]||0)/60;
    }
    return {date:g.date,day:Utilities.formatDate(new Date(g.date+'T12:00:00+05:30'),'Asia/Kolkata','EEE'),in:clockIn,out:clockOut,hours:hours,status:status,leave:requests.map(l=>l.status).join(', ')};
  });
  minutes=Math.round(minutes);summary.hours=Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0');
  return {name:row[1],email:email,month:month,monthLabel:meta.label,days:days,leaves:leaves,summary:summary,updated:Utilities.formatDate(new Date(),'Asia/Kolkata','dd MMM yyyy, HH:mm')};
}

/** All DOB/OTP checks run server-side. Never return DOB, OTP, or other staff data. */
function attendanceEmail_(value){
  const email=String(value||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid registered email address.');
  return email;
}
function attendanceHash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value)).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function attendanceLocked_(callback){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error('Please try again in a moment.');try{return callback();}finally{lock.releaseLock();}}
function attendanceLimit_(key,limit,seconds){
  const cache=CacheService.getScriptCache(),raw=cache.get(key),record=raw?JSON.parse(raw):{n:0,end:Date.now()+seconds*1000};
  if(record.end<Date.now()){record.n=0;record.end=Date.now()+seconds*1000;}
  if(record.n>=limit)throw new Error('Too many attempts. Please try again later or use the other sign-in method.');
  record.n++;cache.put(key,JSON.stringify(record),Math.max(1,Math.ceil((record.end-Date.now())/1000)));
}
function attendancePerson_(email){
  const sheet=attendanceBook_().getSheetByName('Deor List');
  if(!sheet||sheet.getLastRow()<3)return null;
  const values=sheet.getRange(3,9,sheet.getLastRow()-2,3).getValues();
  const matches=values.filter(r=>String(r[0]).trim().toLowerCase()===email);
  if(matches.length!==1)return null;
  return {dob:matches[0][2]};
}
function attendanceDob_(value){
  if(value instanceof Date&&!isNaN(value))return Utilities.formatDate(value,'Asia/Kolkata','yyyy-MM-dd');
  const s=String(value||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  return attendanceDate_(s);
}
function attendanceNewSession_(email){
  const token=Utilities.getUuid()+Utilities.getUuid();
  CacheService.getScriptCache().put('session:'+attendanceHash_(token),JSON.stringify({email:email,expires:Date.now()+1800000}),1800);
  return {token:token,expiresIn:1800};
}
function attendanceSessionEmail_(token){
  token=String(token||'');if(token.length!==72)throw new Error('Please sign in to view your attendance.');
  const raw=CacheService.getScriptCache().get('session:'+attendanceHash_(token));
  if(!raw)throw new Error('Your session expired. Please sign in again.');
  const session=JSON.parse(raw);if(session.expires<Date.now())throw new Error('Your session expired. Please sign in again.');return session.email;
}
function attendanceLoginDob(email,dob){
  email=attendanceEmail_(email);dob=String(dob||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw new Error('Enter your date of birth, or leave it blank to receive an email OTP.');
  return attendanceLocked_(()=>{
    attendanceLimit_('dob:'+attendanceHash_(email),5,900);
    const person=attendancePerson_(email),registered=person?attendanceDob_(person.dob):'';
    if(!registered||registered!==dob)throw new Error('Email and date of birth could not be verified. Check your details, or use email OTP.');
    return attendanceNewSession_(email);
  });
}
function attendanceSendOtp(email){
  email=attendanceEmail_(email);
  return attendanceLocked_(()=>{
    const key=attendanceHash_(email),cache=CacheService.getScriptCache();
    attendanceLimit_('otpMinute:'+key,1,60);attendanceLimit_('otpHour:'+key,5,3600);attendanceLimit_('otpGlobal',50,3600);
    const challenge=Utilities.getUuid(),person=attendancePerson_(email);
    // Identical response for an unknown email. Email is sent only to a registered address.
    if(person){
      const entropy=Utilities.getUuid().replace(/-/g,'');const code=String(parseInt(entropy.slice(0,12),16)%1000000).padStart(6,'0');
      const record={email:email,hash:attendanceHash_(challenge+':'+code),attempts:0,expires:Date.now()+300000};
      // Resending invalidates any earlier challenge for the same email.
      const old=cache.get('activeOtp:'+key);if(old)cache.remove('otp:'+old);
      cache.put('otp:'+challenge,JSON.stringify(record),300);cache.put('activeOtp:'+key,challenge,300);
      try{MailApp.sendEmail({to:email,subject:'Your Siddhi Cold Chain attendance OTP',body:'Your attendance dashboard OTP is '+code+'.\n\nIt expires in 5 minutes. Do not share this code.\nIf you did not request it, ignore this email.\n\nSiddhi Cold Chain · Lawrence Road',name:'Siddhi Cold Chain Attendance'});}catch(err){cache.remove('otp:'+challenge);cache.remove('activeOtp:'+key);throw new Error('OTP email could not be sent. Please try again later or sign in with your registered date of birth.');}
    }
    return {challenge:challenge,message:'If this email is registered, a 6-digit OTP has been sent. It expires in 5 minutes.'};
  });
}
function attendanceVerifyOtp(challenge,code){
  challenge=String(challenge||'');code=String(code||'').trim();
  if(!/^[a-f0-9-]{36}$/i.test(challenge)||!/^\d{6}$/.test(code))throw new Error('Enter the 6-digit OTP from your email.');
  return attendanceLocked_(()=>{
    const cache=CacheService.getScriptCache(),raw=cache.get('otp:'+challenge);
    if(!raw)throw new Error('OTP is invalid or expired. Please request a new OTP.');
    const record=JSON.parse(raw),key=attendanceHash_(record.email);
    if(record.expires<Date.now()||record.attempts>=5||cache.get('activeOtp:'+key)!==challenge){cache.remove('otp:'+challenge);throw new Error('OTP is invalid or expired. Please request a new OTP.');}
    record.attempts++;
    if(record.hash!==attendanceHash_(challenge+':'+code)){
      if(record.attempts>=5)cache.remove('otp:'+challenge);else cache.put('otp:'+challenge,JSON.stringify(record),Math.max(1,Math.ceil((record.expires-Date.now())/1000)));
      throw new Error('Incorrect OTP. Please check the code in your email.');
    }
    cache.remove('otp:'+challenge);cache.remove('activeOtp:'+key);return attendanceNewSession_(record.email);
  });
}
function attendanceLogout(token){
  token=String(token||'');if(token.length===72)CacheService.getScriptCache().remove('session:'+attendanceHash_(token));return true;
}
