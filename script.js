// Get the HTML elements
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const checkInBtn = document.getElementById("checkInBtn");

const attendeeCount = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const greeting = document.getElementById("greeting");

const celebration = document.getElementById("celebration");
const attendeeList = document.getElementById("attendeeList");
const emptyState = document.getElementById("emptyState");
const resetBtn = document.getElementById("resetBtn");

// Event settings
const maxCount = 50;
const storageKey = "sustainabilitySummitAttendees";

// Information about each team
const teams = {
  water: {
    name: "Team Water Wise",
    icon: "🌊",
  },

  zero: {
    name: "Team Net Zero",
    icon: "🌿",
  },

  power: {
    name: "Team Renewables",
    icon: "⚡",
  },
};

// Load saved attendees when the page opens
let attendees = loadAttendees();

// Display the saved information
renderPage();

// Handle a new attendee check-in
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  // Make sure a name and team were provided
  if (!name || !teams[team]) {
    return;
  }

  // Do not allow more check-ins after reaching the goal
  if (attendees.length >= maxCount) {
    showGreeting(
      "The event has already reached its attendance goal."
    );

    return;
  }

  // Add the new attendee
  attendees.push({
    name: name,
    team: team,
  });

  // Save the updated attendee list
  saveAttendees();

  // Update everything displayed on the page
  renderPage();

  // Show the welcome message
  showGreeting(
    `Welcome, ${name}! You have checked in with ${teams[team].name}.`
  );

  // Clear the form
  form.reset();

  // Return the cursor to the name input
  if (attendees.length < maxCount) {
    nameInput.focus();
  }
});

// Reset all attendee information
resetBtn.addEventListener("click", function () {
  const shouldReset = window.confirm(
    "Are you sure you want to remove all attendee check-ins?"
  );

  if (!shouldReset) {
    return;
  }

  attendees = [];

  // Remove saved data from localStorage
  localStorage.removeItem(storageKey);

  // Hide the greeting message
  greeting.style.display = "none";

  // Update the page
  renderPage();

  nameInput.focus();
});

// Save attendees in localStorage
function saveAttendees() {
  localStorage.setItem(
    storageKey,
    JSON.stringify(attendees)
  );
}

// Load saved attendees from localStorage
function loadAttendees() {
  try {
    const savedData = localStorage.getItem(storageKey);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    // Make sure the saved data is an array
    if (!Array.isArray(parsedData)) {
      return [];
    }

    // Only keep valid attendee objects
    return parsedData
      .filter(function (attendee) {
        return (
          attendee &&
          typeof attendee.name === "string" &&
          teams[attendee.team]
        );
      })
      .slice(0, maxCount);
  } catch (error) {
    console.error(
      "The saved attendance data could not be loaded.",
      error
    );

    return [];
  }
}

// Update all information displayed on the page
function renderPage() {
  const total = attendees.length;
  const teamCounts = getTeamCounts();

  const percentage = Math.min(
    (total / maxCount) * 100,
    100
  );

  // Update total attendance
  attendeeCount.textContent = total;

  // Update the progress bar
  progressBar.style.width = percentage + "%";
  progressBar.setAttribute("aria-valuenow", total);

  // Update team attendance counts
  document.getElementById("waterCount").textContent =
    teamCounts.water;

  document.getElementById("zeroCount").textContent =
    teamCounts.zero;

  document.getElementById("powerCount").textContent =
    teamCounts.power;

  // Update the attendee list
  renderAttendeeList();

  // Check whether the goal has been reached
  updateGoalAndWinner(teamCounts);
}

// Calculate each team's attendance
function getTeamCounts() {
  const counts = {
    water: 0,
    zero: 0,
    power: 0,
  };

  attendees.forEach(function (attendee) {
    counts[attendee.team]++;
  });

  return counts;
}

// Display attendee names and teams
function renderAttendeeList() {
  // Remove the previous list items
  attendeeList.replaceChildren();

  // Display the empty message when there are no attendees
  if (attendees.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  // Display the newest check-in first
  attendees
    .slice()
    .reverse()
    .forEach(function (attendee) {
      const listItem = document.createElement("li");
      listItem.className = "attendee-item";

      const attendeeName = document.createElement("span");
      attendeeName.className = "attendee-name";
      attendeeName.textContent = attendee.name;

      const teamBadge = document.createElement("span");
      teamBadge.className =
        "team-badge " + attendee.team;

      teamBadge.textContent =
        teams[attendee.team].icon +
        " " +
        teams[attendee.team].name;

      listItem.append(attendeeName, teamBadge);
      attendeeList.appendChild(listItem);
    });
}

// Celebrate and highlight the winner when attendance reaches 50
function updateGoalAndWinner(teamCounts) {
  // Remove any previous winner highlighting
  document
    .querySelectorAll(".team-card")
    .forEach(function (card) {
      card.classList.remove("winner");
    });

  const goalReached = attendees.length >= maxCount;

  // Disable the form when the goal has been reached
  nameInput.disabled = goalReached;
  teamSelect.disabled = goalReached;
  checkInBtn.disabled = goalReached;

  if (!goalReached) {
    celebration.style.display = "none";
    celebration.textContent = "";
    return;
  }

  // Find the highest team attendance
  const highestCount = Math.max(
    teamCounts.water,
    teamCounts.zero,
    teamCounts.power
  );

  // Find the winning team or teams
  const winningTeamKeys = Object.keys(
    teamCounts
  ).filter(function (team) {
    return teamCounts[team] === highestCount;
  });

  // Highlight every winning team
  winningTeamKeys.forEach(function (team) {
    const winningCard = document.querySelector(
      `[data-team="${team}"]`
    );

    if (winningCard) {
      winningCard.classList.add("winner");
    }
  });

  // Display one winner
  if (winningTeamKeys.length === 1) {
    const winner = winningTeamKeys[0];

    celebration.textContent =
      `🎉 Attendance goal reached! ` +
      `${teams[winner].name} wins with ` +
      `${highestCount} attendees!`;
  } else {
    // Display tied teams
    const tiedNames = winningTeamKeys
      .map(function (team) {
        return teams[team].name;
      })
      .join(" and ");

    celebration.textContent =
      `🎉 Attendance goal reached! ` +
      `It is a tie between ${tiedNames}, ` +
      `with ${highestCount} attendees each!`;
  }

  celebration.style.display = "block";
}

// Display a greeting or feedback message
function showGreeting(message) {
  greeting.textContent = message;
  greeting.className = "success-message";
  greeting.style.display = "block";
}