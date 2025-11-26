(function(){
  function formatMoney(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  async function fetchCheckingsData(userId) {
    try {
      const res = await fetch(`/api/user/overview?userId=${userId}`);
      const json = await res.json();

      if (!json.ok) {
        console.error('Overview error:', json.error);
        return;
      }

      const { data } = json;

      // Update balance
      document.getElementById('checkings-balance').textContent = formatMoney(data.balance || 0);

      const transList = document.getElementById('checkings-transactions');
      if (data.transactions && data.transactions.length > 0) {
        transList.innerHTML = data.transactions.map(trans => {
          const amtClass = trans.amount >= 0 ? 'positive' : 'negative';
          return `<li><span>${trans.vendor}</span> <span class="muted">${trans.dateLabel}</span> <strong class="${amtClass}">${formatMoney(trans.amount)}</strong></li>`;
        }).join('');
      } else {
        transList.innerHTML = '<li class="muted">No transactions</li>';
      }

    } catch (err) {
      console.error('Failed to fetch checkings data:', err);
      document.getElementById('checkings-balance').textContent = 'Error';
    }
  }

  function initCheckings() {
    // Get user ID from sessionStorage
    const userEmail = sessionStorage.getItem('sb_user_email');
    if (!userEmail) {
      console.warn('No user session found');
      return;
    }

    const userId = sessionStorage.getItem('sb_user_id') || 1;
    
    fetchCheckingsData(userId);
  }

  document.addEventListener('includesLoaded', initCheckings);
  document.addEventListener('DOMContentLoaded', initCheckings);
})();
