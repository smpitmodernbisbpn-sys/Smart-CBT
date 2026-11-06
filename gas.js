const ALLOWED = new Set(['getInitialData','getMonitoringData','getResults','getAssignments','getUsers','saveQuestions','saveResult','saveResults','saveAssignments','saveUsers','saveSettings','updateStudentProgress','clearMonitoringData','resetStudentExam','cleanupInvalidResults','deleteResultEntry','uploadImageToDrive']);
module.exports = async function handler(req,res) {
  if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try {
    const {url,method,args=[]} = req.body || {};
    const u = new URL(url);
    if(u.protocol !== 'https:' || u.hostname !== 'script.google.com' || !/^\/macros\/s\/[\w-]+\/exec$/.test(u.pathname)) throw Error('URL Apps Script tidak valid');
    if(!ALLOWED.has(method) || !Array.isArray(args)) throw Error('Metode tidak diizinkan');
    const response = await fetch(u.toString(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({method,args}),redirect:'follow',signal:AbortSignal.timeout(25000)});
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch {throw Error('Apps Script tidak mengembalikan JSON. Periksa akses deployment dan URL /exec.');}
    if(!response.ok || result.ok === false) throw Error(result.error || `HTTP ${response.status}`);
    res.status(200).json({ok:true,data:result.data});
  } catch(e) {res.status(502).json({ok:false,error:e.message});}
};
