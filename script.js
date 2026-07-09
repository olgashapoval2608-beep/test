// Home screen — floating locate button micro-interaction
const locateBtn = document.getElementById('locate-btn');
if (locateBtn) {
  locateBtn.addEventListener('click', () => {
    locateBtn.style.transform = 'scale(0.9)';
    setTimeout(() => { locateBtn.style.transform = ''; }, 120);
  });
}
