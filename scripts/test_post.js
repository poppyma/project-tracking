(async()=>{
  try{
    const payload = {
      name: 'AutoTest ' + Date.now(),
      customer: 'ACME',
      application: 'TestApp',
      productLine: 'PL',
      anualVolume: '100',
      estSop: '2026-01-01',
      materials: ['Mat A','Mat B','Mat C']
    };
    const res = await fetch('http://localhost:3000/api/projects', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(payload)});
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
