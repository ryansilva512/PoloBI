(async()=>{
  const res = await fetch('https://developers.milvus.com.br');
  const text = await res.text();
  const match = text.match(/swagger[^\"]*json/i);
  console.log(match && match[0]);
})();
