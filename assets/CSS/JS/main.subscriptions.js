(function() {

  // fake data
  let subs = [
    { name: "Spotify", day: 3, amount: 9.99 },
    { name: "Netflix", day: 12, amount: 12.99 },
    { name: "Gym", day: 5, amount: 29.99 },
    { name: "Hot Chip", day: 26, amount: 19.99 }
  ];

  let currentDate = new Date();

  function money(x) {
    return "$" + x.toFixed(2);
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

    btn.addEventListener("click", function() {
      let n = document.getElementById("new-name").value.trim();
      let d = parseInt(document.getElementById("new-day").value);
      let amt = parseFloat(document.getElementById("new-amount").value);

  



      // clear inputs
      document.getElementById("new-name").value = "";
      document.getElementById("new-day").value = "";
      document.getElementById("new-amount").value = "";

      drawCalendar(currentDate);
    });
  }

  function updateSubsList() {
    let ul = document.getElementById("subs-list");
    if (!ul) return;

    ul.innerHTML = "";

    for (let i = 0; i < subs.length; i++) {
      let li = document.createElement("li");
      let left = document.createElement("span");
      let right = document.createElement("span");

      left.textContent = subs[i].name;
      right.textContent = money(subs[i].amount);

      li.appendChild(left);
      li.appendChild(right);
      ul.appendChild(li);
    }
  }

  function signOutSetup() {
    const btn = document.getElementById("sign-out");
    if (!btn) return;

    btn.onclick = function() {
      console.log("Signing out...");
      localStorage.clear();
      window.location.href = "login.html";
    };
  }

  function init() {
    controls();
    drawCalendar(currentDate);
    setupForm();
    signOutSetup();
  }

  document.addEventListener("includesLoaded", init);
  document.addEventListener("DOMContentLoaded", init);

})();
