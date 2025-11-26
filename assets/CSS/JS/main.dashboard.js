(function(){
  function formatMoney(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  async function fetchOverview(userId) {
    try {
      const res = await fetch(`/api/user/overview?userId=${userId}`);
      const json = await res.json();

      if (!json.ok) {
        console.error('Overview error:', json.error);
        return;
      }

      const { data } = json;

      // Update overview stats
      document.getElementById('balance-amount').textContent = formatMoney(data.balance || 0);
      document.getElementById('income-amount').textContent = formatMoney(data.incomeTotal || 0);
      document.getElementById('expense-amount').textContent = formatMoney(data.expenseTotal || 0);

      // Update bills list
      const billsList = document.getElementById('bills-list');
      if (data.bills && data.bills.length > 0) {
        billsList.innerHTML = data.bills.map(bill => 
          `<li>${bill.vendor} — <span class="muted">${bill.dueDate}</span> <strong>${formatMoney(bill.amount)}</strong></li>`
        ).join('');
      } else {
        billsList.innerHTML = '<li class="muted">No upcoming bills</li>';
      }

      // Update transactions list
      const transList = document.getElementById('transactions-list');
      if (data.transactions && data.transactions.length > 0) {
        transList.innerHTML = data.transactions.map(trans => 
          `<li>${trans.vendor} — <span class="muted">${trans.dateLabel}</span> <strong>${formatMoney(trans.amount)}</strong></li>`
        ).join('');
      } else {
        transList.innerHTML = '<li class="muted">No transactions</li>';
      }

    } catch (err) {
      console.error('Failed to fetch overview:', err);
      document.getElementById('balance-amount').textContent = 'Error';
    }
  }

  function initDashboard() {
    // Get user ID 
    const userEmail = sessionStorage.getItem('sb_user_email');
    if (!userEmail) {
      console.warn('No user session found');
      return;
    }

    // For now, use a dummy userId. 
    const userId = sessionStorage.getItem('sb_user_id') || 1;
    
    fetchOverview(userId);
  }

  document.addEventListener('includesLoaded', initDashboard);
  document.addEventListener('DOMContentLoaded', initDashboard);
})();
