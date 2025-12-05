(function(){
  function formatMoney(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  function updatePieChart(income, expenses) {
    const chartEl = document.getElementById('budget-chart');
    const incomeLabel = document.getElementById('chart-income');
    const expensesLabel = document.getElementById('chart-expenses');
    
    if (!chartEl) return;
    
    // Update legend
    if (incomeLabel) incomeLabel.textContent = formatMoney(income);
    if (expensesLabel) expensesLabel.textContent = formatMoney(expenses);
    
    // Calculate percentages
    const total = income + expenses;
    if (total === 0) {
      // Show empty state
      chartEl.style.background = '#e5e7eb';
      return;
    }
    
    const incomePercent = (income / total) * 100;
    const expensePercent = (expenses / total) * 100;
    
    // Create conic gradient: green for income, red for expenses
    chartEl.style.background = `conic-gradient(
      #10b981 0% ${incomePercent}%,
      #ef4444 ${incomePercent}% 100%
    )`;
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
      const balanceEl = document.getElementById('balance-amount');
      if (balanceEl) balanceEl.textContent = formatMoney(data.balance || 0);
      
      const incomeEl = document.getElementById('income-amount');
      if (incomeEl) incomeEl.textContent = formatMoney(data.incomeTotal || 0);
      
      const expenseEl = document.getElementById('expense-amount');
      if (expenseEl) expenseEl.textContent = formatMoney(data.expenseTotal || 0);

      // Update pie chart
      updatePieChart(data.incomeTotal || 0, data.expenseTotal || 0);

      // Update bills list 
      const billsList = document.getElementById('bills-list');
      if (billsList) {
        if (data.bills && data.bills.length > 0) {
          billsList.innerHTML = data.bills.map(bill => {
            const amount = typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount);
            return `<li>${bill.vendor} — <span class="muted">${bill.dueDate}</span> <strong>${formatMoney(amount)}</strong></li>`;
          }).join('');
        } else {
          billsList.innerHTML = '<li class="muted">No upcoming bills</li>';
        }
      }

      // Update transactions list
      const transList = document.getElementById('transactions-list');
      if (transList) {
        if (data.transactions && data.transactions.length > 0) {
          transList.innerHTML = data.transactions.map(trans => {
            const amount = typeof trans.amount === 'number' ? trans.amount : parseFloat(trans.amount);
            const color = amount >= 0 ? 'color: #10b981' : 'color: #ef4444';
            return `<li>${trans.vendor} — <span class="muted">${trans.dateLabel}</span> <strong style="${color}">${formatMoney(amount)}</strong></li>`;
          }).join('');
        } else {
          transList.innerHTML = '<li class="muted">No transactions</li>';
        }
      }

    } catch (err) {
      console.error('Failed to fetch overview:', err);
      const balanceEl = document.getElementById('balance-amount');
      if (balanceEl) balanceEl.textContent = 'Error';
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
