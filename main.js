const apikey = "tYekUbMgHsDcEblf230XxA7WmLMbxFxqALAleZIGZatgAeKCKh7RuaJ1EKGsURCf";
const summaryKeys = {};

if (!localStorage) {
  alert("No localStorage available, data may be lost.");
}

class ScoutingData {
  constructor(roundNumber, teamNumber, scouterName, alliance) {
    this.roundNumber = roundNumber;
    this.teamNumber = teamNumber;
    this.alliance = alliance;
    this.scouterName = scouterName;
    this.events = [];
  }
}

try {
  data = JSON.parse(localStorage.ScoutingData ?? "[]");
} catch {
  alert("Data error: JSON parsing error.");
  data = [];
  localStorage.Error = localStorage.ScoutingData;
  localStorage.ScoutingData = "[]";
}
let currentData = data[data.length - 1] ?? new ScoutingData(null, null, "", null);

if (data.length == 0) {
  data[0] = currentData;
}

teamNumber.value = currentData.teamNumber;
roundNumber.value = currentData.roundNumber;
scouterName.value = currentData.scouterName;

if (currentData.alliance == "blue") {
  allianceToggle.innerText = "Blue";
  allianceToggle.className = "input-inline blue";
} else if (currentData.alliance = "red") {
  allianceToggle.innerText = "Red";
  allianceToggle.className = "input-inline red";
}

document.getElementById("submit").disabled = !validateData();

function textField(input, name, key, onchange) {
  input.addEventListener("onchange", e => {
    currentData[name] = input.value || input.innerHTML;
    if (onchange) onchange();

    saveData();

    console.log("Test");
  });
  if (input.tagName == "TEXTAREA") {
    input.textContent = currentData[name];
  } else {
    input.value = currentData[name];
  }
  summaryKeys[name] = key;
}

function stateButton(states, button, name, key, onclick) {

  button.addEventListener("click", e => {
    var index = (states.indexOf(currentData[name] ?? states[0]) + 1) % states.length;

    button.innerHTML = name + ":<br>" + states[index];
    currentData[name] = states[index];

    if (onclick) onclick();
    saveData();
  });

  summaryKeys[name] = key;

  if (!currentData[key]) {
    currentData[key] = states[0];
    saveData();
  }
  
  button.innerHTML = name + ":<br>" + currentData[key] ?? states[0];
  if (onclick) onclick();
}

function eventButton(button, name, key) {

  button.addEventListener("click", e => {
    var event = {
      name: name,
      time: Date.now() - gameStartTime,
    };

    if (!currentData.events) {
      currentData.events = [];
    }
    currentData.events.push(event);
    createLogEntry(event.time, name, () => {
      currentData.events.splice(currentData.events.indexOf(event), 1);
    });
    saveData();
  });

  summaryKeys[name] = key;
}

var index = 0;

function createLogEntry(time, name, undo) {
  var li = document.createElement("li");
  li.id = `logEntry${index}`;
  var button = document.createElement("button");
  button.id = `logEntry${index++}Undo`;
  button.innerText = "UNDO";
  button.addEventListener("click", e => {
    log.removeChild(li);
    undo();
    saveData();
  })
  li.appendChild(button);
  var span = document.createElement("span");
  span.innerText = ` ${name} @ ${parseTime(time)}`;
  li.appendChild(span);
  log.insertBefore(li, log.firstChild);
}

document.addEventListener("DOMContentLoaded", () => {

  if (!Array.isArray(currentData.events)){ 
    currentData.events = [];
  }

  for (var event of currentData.events) {
    const e = event;
    createLogEntry(e.time, e.name, () => {
      currentData.events.splice(currentData.events.indexOf(e), 1);
      saveData();
    });
  }

  textField(notes, "notes", "n");

  eventButton(coralIntakeButton, "Coral Intaken", "c");
  eventButton(processorScoreButton, "Processor Scored", "p");
  eventButton(bargeHumanButton, "Barge by Human", "h");
  eventButton(bargeRobotButton, "Barge by Robot", "r");
  eventButton(L1ScoreButton, "L1 Coral Scored", "1");
  eventButton(L2ScoreButton, "L2 Coral Scored", "2");
  eventButton(L3ScoreButton, "L3 Coral Scored", "3");
  eventButton(L4ScoreButton, "L4 Coral Scored", "4");
  eventButton(AlgaeRemovedButton, "Algae Removed", "a");

  endEarlyButton.addEventListener("click", e => {
    const oldStartTime = gameStartTime;
    createLogEntry(Date.now() - gameStartTime, "Robot Disabled", () => {
      gameStartTime = oldStartTime;
      startButton.innerText = "Start";
      confirmRestart = false;

      gameFrameUpdate();
  
      startButton.hidden = true;
      nextButton.hidden = true;
    });
    endGame();
  });

  stateButton(["No Attempt", "Shallow Climb", "Deep Climb"], cageToggle, "Cage Climb", "cage");
  stateButton(["None", "Ground", "Feed", "Both"], coralIntakeDesign, "Coral Intake", "ciD", () => {
    coralIntakeDirection.hidden = currentData["Coral Intake"] == "None";
  });
  stateButton(["Horizontal", "Vertical"], coralIntakeDirection, "Coral Direction", "ciR");

  allianceToggle.addEventListener("click", e => {
    if (currentData.alliance == "red") {
      currentData.alliance = "blue";
      allianceToggle.innerText = "Blue";
      allianceToggle.className = "input-inline blue";
    } else {
      currentData.alliance = "red";
      allianceToggle.innerText = "Red";
      allianceToggle.className = "input-inline red";
    }
    saveData();
  });

  startButton.addEventListener("click", e => {

    if (confirmRestart) {
      if (!confirm("Are you sure you want to restart the game?")) {
        return;
      }
    }
    gameStartTime = Date.now();

    gameFrameUpdate();

    startButton.hidden = true;
    nextButton.hidden = true;

    saveData();
  });

  const form = document.getElementById("setupForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {    
    e.preventDefault();
    saveData();

    loadPage(2);
  });

  if (localStorage.currentPage) {
    loadPage(+localStorage.currentPage)
  } else {
    loadPage(1);
  }
});

function saveData() {
  localStorage.ScoutingData = JSON.stringify(data);

  document.getElementById("submit").disabled = !validateData();
}

function validateData() {
  return currentData.teamNumber && currentData.alliance && currentData.roundNumber && currentData.scouterName;
}

function parseTime(gameTime) {
  return Math.floor(gameTime / 60000) + ":" + Math.floor(gameTime % 60000 / 1000).toString().padStart(2, "0") + "." + Math.floor(gameTime % 1000 / 10).toString().padStart(2, "0");
}

var confirmRestart = false;
var summary = {};

function summarize() {
  summary = {};
  for (var event of currentData.events) {
    summary[event.name] = (summary[event.name] ?? 0) + 1;
  }

  summaryBox.innerHTML = `<br><li>Scouter: ${currentData.scouterName}</li><li>Team: ${currentData.teamNumber} (${currentData.alliance})</li><li>Round: ${currentData.roundNumber}</li>`;

  for (var event in summary) {
    var li = document.createElement("li");
    li.id = `summary${event}`;
    var span = document.createElement("span");
    span.innerText = `${event}: ${summary[event]}`;
    li.appendChild(span);
    summaryBox.insertBefore(li, summaryBox.firstChild);
  }

  var s = summary;
  summary = { m: currentData.scouterName, t: currentData.teamNumber, a: currentData.a, };
  for (var event in s) {
    summary[summaryKeys[event]] = s[event];
  }
}

function endGame() {
  gameStartTime = null;
  gameStatus.textContent = "Game Over!";
  startButton.hidden = false;
  startButton.innerText = "Restart";
  confirmRestart = true;
  nextButton.hidden = false;

  summarize();

  exportData();
}

async function getRounds(event) {
  return await (await fetch(`https://www.thebluealliance.com/api/v3/event/${event}/matches?X-TBA-Auth-Key=${apikey}`)).json();
}

localStorage.rounds = getRounds("2024wabon");

function exportData() {
  summarize();
  qrcode.innerHTML = "";
  new QRCode("qrcode", JSON.stringify(summary));
}

function gameFrameUpdate() {
  if (gameStartTime) {
    var gameTime = Date.now() - gameStartTime;
    const time = parseTime(gameTime);
    timer.textContent = time;
    var oldStatus = gameStatus.textContent;
    gameStatus.textContent = gameTime < autoLength * 1000 ? "Auto" : "TeleOp";

    if (oldStatus == "Auto" && gameStatus.textContent == "TeleOp") {
      currentData.autoEvents = JSON.parse(JSON.stringify(currentData.events));
    }

    if (gameTime > gameLength * 1000) {
      endGame();
      return;
    }

    requestAnimationFrame(gameFrameUpdate);
  }
}

const gameLength = 2*60 + 30;
const autoLength = 15;
var currentPage = 0;
var gameStartTime = null;

function loadPage(page) {
  document.getElementById("page-" + currentPage).hidden = true;
  document.getElementById("page-" + page).hidden = false;
  currentPage = page;

  localStorage.currentPage = page;

  switch (page) {
    case 3: endGame();
    case 4: exportData();
  }
}