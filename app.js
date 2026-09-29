const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelector('.account-button')?.addEventListener('click', () => showToast('Account access is coming soon.'));
document.querySelector('.icon-control[aria-label="Search"]')?.addEventListener('click', () => showToast('Search will be available with the first collection.'));
document.querySelector('.icon-control[aria-label="Shopping bag"]')?.addEventListener('click', () => showToast('Your bag is ready for your first design.'));
document.querySelector('.menu-button')?.addEventListener('click', () => showToast('Navigation is available on larger screens.'));
