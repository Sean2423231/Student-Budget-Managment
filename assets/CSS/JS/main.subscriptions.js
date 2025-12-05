(function() {

  // subscriptions data from database
  let subs = [];

  let currentDate = new Date();
  let currentView = 'monthly'; // Track current view: daily, weekly, monthly, yearly

  function money(x) {
    return "$" + x.toFixed(2);
  }

  // Helper function to determine if a subscription should show on a specific day
  function shouldShowSubscriptionOnDay(sub, dayOfMonth, dateObj) {
    const currentDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dayOfMonth);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    switch (sub.frequency) {
      case 'daily':
        // Show every day
        return true;
      
      case 'weekly':
        // Show on the specified day of week (stored as day 0-6)
        return dayOfWeek === sub.day;
      
      case 'monthly':
        // Show on the specified day of month
        return dayOfMonth === sub.day;
      
      case 'yearly':
        // For yearly, sub.day stores month (0-11) and sub.yearlyDay stores day of month
        // Only show if both the month and day match
        const currentMonth = dateObj.getMonth();
        const matches = currentMonth === sub.day && dayOfMonth === (sub.yearlyDay || 1);
        if (sub.frequency === 'yearly') {
          console.log(`Yearly check: ${sub.name}, currentMonth=${currentMonth}, sub.day=${sub.day}, dayOfMonth=${dayOfMonth}, yearlyDay=${sub.yearlyDay}, matches=${matches}`);
        }
        return matches;
      
      default:
        return false;
    }
  }

  // Calculate total for all subscriptions in the current month
  function calculateTotal(dateObj) {
    const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
    
    let total = 0;
    
    for (let sub of subs) {
      switch (sub.frequency) {
        case 'daily':
          // Daily subscriptions occur every day
          total += sub.amount * daysInMonth;
          break;
        
        case 'weekly':
          // Count how many times this day of week occurs in the month
          let weeklyCount = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            if (shouldShowSubscriptionOnDay(sub, d, dateObj)) {
              weeklyCount++;
            }
          }
          total += sub.amount * weeklyCount;
          break;
        
        case 'monthly':
          // Monthly subscriptions occur once per month
          if (sub.day <= daysInMonth) {
            total += sub.amount;
          }
          break;
        
        case 'yearly':
          // Yearly subscriptions occur once per year
          // Only count the full amount if we're in the subscription's month
          const currentMonth = dateObj.getMonth();
          if (currentMonth === sub.day) {
            total += sub.amount;
          }
          break;
      }
    }
    
    return total;
  }

  async function loadSubscriptions() {
    const userId = sessionStorage.getItem('sb_user_id');
    if (!userId) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const res = await fetch(`/api/user/subscriptions?userId=${userId}`);
      const json = await res.json();

      if (json.ok && json.subscriptions) {
        subs = json.subscriptions.map(sub => ({
          id: sub.id,
          name: sub.name,
          day: sub.day,
          amount: parseFloat(sub.amount),
          frequency: sub.frequency,
          yearlyDay: sub.yearly_day // For yearly subscriptions, the day of month
        }));
        
        console.log('Loaded subscriptions:', subs);
        drawCalendar(currentDate);
      } else {
        console.error('Failed to load subscriptions:', json.error);
        subs = [];
        drawCalendar(currentDate);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      subs = [];
      drawCalendar(currentDate);
    }
  }

  function drawCalendar(dateObj) {
    console.log("Rendering calendar for", dateObj);

    const calEl = document.getElementById("calendar");
    const titleEl = document.getElementById("calendar-title");

    calEl.innerHTML = "";

    const yr = dateObj.getFullYear();
    const mn = dateObj.getMonth();

    titleEl.textContent = dateObj.toLocaleString(undefined, {
      month: "long",
      year: "numeric"
    });

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(d) {
      let div = document.createElement("div");
      div.className = "calendar-weekday";
      div.textContent = d;
      calEl.appendChild(div);
    });

    const firstDay = new Date(yr, mn, 1);
    const lastDay = new Date(yr, mn + 1, 0);
    const padCount = firstDay.getDay();

    // add blank cells
    for (let x = 0; x < padCount; x++) {
      let blank = document.createElement("div");
      blank.className = "calendar-day";
      calEl.appendChild(blank);
    }

    // days loop
    for (let d = 1; d <= lastDay.getDate(); d++) {

      let dayCell = document.createElement("div");
      dayCell.className = "calendar-day";

      let dateDiv = document.createElement("div");
      dateDiv.className = "date";
      dateDiv.textContent = d;
      dayCell.appendChild(dateDiv);

      let evWrap = document.createElement("div");
      evWrap.className = "events";

      // Show all subscriptions that match this day
      for (let j = 0; j < subs.length; j++) {
        if (shouldShowSubscriptionOnDay(subs[j], d, dateObj)) {
          let pill = document.createElement("div");
          pill.className = "event-pill sub";
          pill.textContent = subs[j].name + " " + money(subs[j].amount);
          evWrap.appendChild(pill);
        }
      }

      dayCell.appendChild(evWrap);
      calEl.appendChild(dayCell);
    }

    // Calculate and display total based on current view
    const total = calculateTotal(dateObj);
    document.getElementById("subs-total").textContent = money(total);

    updateSubsList();
  }

  function controls() {
    let prev = document.getElementById("prev-month");
    let next = document.getElementById("next-month");

    if (prev) {
      prev.onclick = function() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        drawCalendar(currentDate);
      };
    }
    if (next) {
      next.onclick = function() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        drawCalendar(currentDate);
      };
    }
  }
  function setupForm() {
    let btn = document.getElementById("add-sub");
    let freqSelect = document.getElementById("new-frequency");
    let dayInput = document.getElementById("new-day");
    let dayDropdown = document.getElementById("new-day-dropdown");
    let monthDropdown = document.getElementById("new-month");
    let dayLabel = document.getElementById("day-label");
    let monthLabel = document.getElementById("month-label");
    
    if (freqSelect) {
      freqSelect.addEventListener("change", function() {
        const freq = this.value;
        switch (freq) {
          case 'daily':
            dayInput.style.display = 'none';
            dayDropdown.style.display = 'none';
            monthDropdown.style.display = 'none';
            break;
          case 'weekly':
            dayInput.style.display = 'none';
            dayDropdown.style.display = 'block';
            monthDropdown.style.display = 'none';
            if (dayLabel) dayLabel.textContent = 'Day of week';
            break;
          case 'monthly':
            dayInput.style.display = 'block';
            dayDropdown.style.display = 'none';
            monthDropdown.style.display = 'none';
            dayInput.placeholder = 'Day of month (1-31)';
            dayInput.min = '1';
            dayInput.max = '31';
            dayInput.value = '';
            if (dayLabel) dayLabel.textContent = 'Day of month';
            break;
          case 'yearly':
            dayInput.style.display = 'block';
            dayDropdown.style.display = 'none';
            monthDropdown.style.display = 'block';
            dayInput.placeholder = 'Day of month (1-31)';
            dayInput.min = '1';
            dayInput.max = '31';
            dayInput.value = '';
            if (dayLabel) dayLabel.textContent = 'Day of month';
            if (monthLabel) monthLabel.textContent = 'Month';
            break;
        }
      });
    }
    
    if (!btn) return;

    btn.addEventListener("click", async function() {
      let n = document.getElementById("new-name").value.trim();
      let freq = document.getElementById("new-frequency").value;
      let d;
      let yearlyDay = null;
      let amt = parseFloat(document.getElementById("new-amount").value);

      // Get day value based on frequency
      if (freq === 'daily') {
        d = 1; // Not used
      } else if (freq === 'weekly') {
        d = parseInt(dayDropdown.value);
        if (isNaN(d)) {
          alert("Please select a day of the week");
          return;
        }
      } else if (freq === 'yearly') {
        // For yearly: d = month (0-11), yearlyDay = day of month (1-31)
        d = parseInt(monthDropdown.value);
        yearlyDay = parseInt(dayInput.value);
        if (isNaN(d) || isNaN(yearlyDay) || yearlyDay < 1 || yearlyDay > 31) {
          alert("Please select a month and enter a valid day (1-31)");
          return;
        }
      } else {
        // Monthly
        d = parseInt(dayInput.value);
        if (isNaN(d) || d < 1 || d > 31) {
          alert("Please enter a valid day (1-31)");
          return;
        }
      }

      // Validation
      if (!n || isNaN(amt)) {
        alert("Please fill in name and amount");
        return;
      }

      const userId = sessionStorage.getItem("sb_user_id");
      if (!userId) {
        alert("Please log in first");
        window.location.href = "login.html";
        return;
      }

      try {
        const requestBody = {
          userId: parseInt(userId),
          name: n,
          price: amt,
          day: d,
          frequency: freq
        };
        
        // Add yearlyDay for yearly subscriptions
        if (freq === 'yearly' && yearlyDay !== null) {
          requestBody.yearlyDay = yearlyDay;
        }
        
        const response = await fetch('/api/user/subscriptions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.ok) {
          // Reload subscriptions and redraw calendar
          await loadSubscriptions();
          
          // Clear inputs
          document.getElementById("new-name").value = "";
          document.getElementById("new-day").value = "";
          document.getElementById("new-amount").value = "";
          document.getElementById("new-frequency").value = "monthly";
          // Reset form display
          dayInput.style.display = 'block';
          dayDropdown.style.display = 'none';
          monthDropdown.style.display = 'none';
          dayInput.placeholder = 'Day of month (1-31)';
        } else {
          alert("Error adding subscription: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Add subscription error:", err);
        alert("Failed to add subscription");
      }
    });
  }

  async function deleteSubscription(subId) {
    const userId = sessionStorage.getItem('sb_user_id');
    if (!userId) return;

    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/subscriptions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          subId: subId
        })
      });

      const data = await response.json();
      if (data.ok) {
        await loadSubscriptions();
      } else {
        alert('Error deleting subscription: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Delete subscription error:', err);
      alert('Failed to delete subscription');
    }
  }

  function updateSubsList() {
    let ul = document.getElementById("subs-list");
    if (!ul) return;

    ul.innerHTML = "";

    // Show all subscriptions
    for (let i = 0; i < subs.length; i++) {
      let li = document.createElement("li");
      let left = document.createElement("span");
      let right = document.createElement("span");
      let deleteBtn = document.createElement("button");

      left.textContent = subs[i].name + " (" + subs[i].frequency + ")";
      right.textContent = money(subs[i].amount);
      
      deleteBtn.textContent = "✕";
      deleteBtn.className = "delete-sub-btn";
      deleteBtn.style.marginLeft = "8px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.border = "none";
      deleteBtn.style.background = "transparent";
      deleteBtn.style.fontSize = "20px";
      deleteBtn.style.color = "red";
      deleteBtn.onclick = () => deleteSubscription(subs[i].id);

      li.appendChild(left);
      li.appendChild(right);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    }
  }

  function signOutSetup() {
    const btn = document.getElementById("sign-out");
    if (!btn) return;

    btn.onclick = function() {
      console.log("Signing out...");
      try { sessionStorage.removeItem('sb_user_email'); } catch (e) {}
      try { sessionStorage.removeItem('sb_user_id'); } catch (e) {}
      window.location.href = "main.html";
    };
  }

  let initialized = false;
  
  function init() {
    if (initialized) return;
    initialized = true;
    
    controls();
    setupForm();
    signOutSetup();
    loadSubscriptions(); 
  }

  document.addEventListener("includesLoaded", init);
  document.addEventListener("DOMContentLoaded", init);

})();
