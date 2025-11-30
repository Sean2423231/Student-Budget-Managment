(function() {

  // subscriptions data from database
  let subs = [];

  let currentDate = new Date();

  function money(x) {
    return "$" + x.toFixed(2);
  }

  // Fetch subscriptions from database
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
        // Transform database format to match calendar format
        subs = json.subscriptions.map(sub => ({
          id: sub.id,
          name: sub.name,
          day: sub.day,
          amount: parseFloat(sub.amount),
          frequency: sub.frequency
        }));
        
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

      // match subs
      for (let j = 0; j < subs.length; j++) {
        if (subs[j].day === d) {
          let pill = document.createElement("div");
          pill.className = "event-pill sub";
          pill.textContent = subs[j].name + " " + money(subs[j].amount);
          evWrap.appendChild(pill);
        }
      }

      dayCell.appendChild(evWrap);
      calEl.appendChild(dayCell);
    }

    // total
    let t = 0;
    for (let k = 0; k < subs.length; k++) {
      t += subs[k].amount;
    }
    document.getElementById("subs-total").textContent = money(t);

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
    if (!btn) return;

    btn.addEventListener("click", async function() {
      let n = document.getElementById("new-name").value.trim();
      let d = parseInt(document.getElementById("new-day").value);
      let amt = parseFloat(document.getElementById("new-amount").value);

      if (!n || !d || isNaN(amt) || d < 1 || d > 31) {
        alert("Please fill in all fields with valid values");
        return;
      }

      const userId = sessionStorage.getItem("sb_user_id");
      if (!userId) {
        alert("Please log in first");
        window.location.href = "login.html";
        return;
      }

      try {
        const response = await fetch('/api/user/subscriptions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: parseInt(userId),
            name: n,
            price: amt,
            day: d,
            frequency: 'monthly'
          })
        });

        const data = await response.json();
        if (data.ok) {
          // Reload subscriptions and redraw calendar
          await loadSubscriptions();
          
          // Clear inputs
          document.getElementById("new-name").value = "";
          document.getElementById("new-day").value = "";
          document.getElementById("new-amount").value = "";
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

    for (let i = 0; i < subs.length; i++) {
      let li = document.createElement("li");
      let left = document.createElement("span");
      let right = document.createElement("span");
      let deleteBtn = document.createElement("button");

      left.textContent = subs[i].name;
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
