(function(){
  function formatMoney(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  function drawBalanceLineChart(data) {
    const svg = document.getElementById('balance-line-chart');
    
    if (!svg) return;

    // Clear existing content
    svg.innerHTML = '';

    // Handle no data case
    if (!data || data.length === 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '50%');
      text.setAttribute('y', '125');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#9ca3af');
      text.setAttribute('font-size', '14');
      text.textContent = 'No transactions this month';
      svg.appendChild(text);
      return;
    }

    const width = svg.clientWidth || 600;
    const height = 250;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max balance for scaling
    const balances = data.map(d => d.balance);
    const minBalance = Math.min(0, ...balances);
    const maxBalance = Math.max(0, ...balances);
    const balanceRange = maxBalance - minBalance || 1;

    // Parse dates
    const dates = data.map(d => new Date(d.date));
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const dateRange = maxDate - minDate || 1;

    // Create scales
    function scaleX(date) {
      return padding.left + ((new Date(date) - minDate) / dateRange) * chartWidth;
    }

    function scaleY(balance) {
      return padding.top + chartHeight - ((balance - minBalance) / balanceRange) * chartHeight;
    }

    // Draw grid lines 
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartHeight / gridSteps) * i;
      const balance = maxBalance - (balanceRange / gridSteps) * i;
      
      // Grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.left);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - padding.right);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e5e7eb');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      // Y-axis label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', padding.left - 10);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('fill', '#6b7280');
      label.setAttribute('font-size', '11');
      label.textContent = '$' + Math.round(balance);
      svg.appendChild(label);
    }

    // Draw zero line (if applicable)
    if (minBalance < 0 && maxBalance > 0) {
      const zeroY = scaleY(0);
      const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      zeroLine.setAttribute('x1', padding.left);
      zeroLine.setAttribute('y1', zeroY);
      zeroLine.setAttribute('x2', width - padding.right);
      zeroLine.setAttribute('y2', zeroY);
      zeroLine.setAttribute('stroke', '#9ca3af');
      zeroLine.setAttribute('stroke-width', '2');
      svg.appendChild(zeroLine);
    }

    // Draw line path
    const pathData = data.map((point, i) => {
      const x = scaleX(point.date);
      const y = scaleY(point.balance);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#667eea');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    // Draw data points
    data.forEach(point => {
      const cx = scaleX(point.date);
      const cy = scaleY(point.balance);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', point.balance >= 0 ? '#10b981' : '#ef4444');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');

      
      svg.appendChild(circle);
    });

    // Draw X-axis labels (dates)
    const maxLabels = 5;
    const labelStep = Math.max(1, Math.floor(data.length / maxLabels));
    data.forEach((point, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = scaleX(point.date);
        const date = new Date(point.date);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height - padding.bottom + 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#6b7280');
        label.setAttribute('font-size', '11');
        label.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
        svg.appendChild(label);
      }
    });
  }

  async function fetchBalanceHistory(userId) {
    try {
      const res = await fetch(`/api/user/balance-history?userId=${userId}`);
      const json = await res.json();

      if (!json.ok) {
        console.error('Balance history error:', json.error);
        return;
      }

      drawBalanceLineChart(json.data);
    } catch (err) {
      console.error('Failed to fetch balance history:', err);
    }
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
      const balanceEl = document.getElementById('balance-display');
      if (balanceEl) {
        balanceEl.textContent = formatMoney(data.balance || 0);
      }

      const transList = document.getElementById('transactions-list');
      if (transList && data.transactions && data.transactions.length > 0) {
        transList.innerHTML = data.transactions.map(trans => {
          const amount = typeof trans.amount === 'number' ? trans.amount : parseFloat(trans.amount);
          const color = amount >= 0 ? 'color: #10b981' : 'color: #ef4444';
          return `<li><span>${trans.vendor}</span> <span class="muted">${trans.dateLabel}</span> <strong style="${color}">${formatMoney(amount)}</strong></li>`;
        }).join('');
      } else if (transList) {
        transList.innerHTML = '<li class="muted">No transactions</li>';
      }

    } catch (err) {
      console.error('Failed to fetch checkings data:', err);
      const balanceEl = document.getElementById('balance-display');
      if (balanceEl) balanceEl.textContent = 'Error';
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
    fetchBalanceHistory(userId);
  }

  document.addEventListener('includesLoaded', initCheckings);
  document.addEventListener('DOMContentLoaded', initCheckings);
})();
