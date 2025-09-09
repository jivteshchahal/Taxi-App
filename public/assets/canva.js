(function(){
  const btn = document.getElementById('import-canva');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/canva/designs');
      if (res.status === 401) {
        window.location.href = '/auth/canva';
        return;
      }
      const data = await res.json();
      console.log('Canva designs:', data);
      alert('Fetched designs from Canva. Check console for details.');
    } catch (err) {
      console.error('Canva fetch failed', err);
    }
  });
})();
