const groupUrlsInput = document.getElementById("groupUrls");
const messagesInput = document.getElementById("messages");
const intervalInput = document.getElementById("interval");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDiv = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["groupUrls", "messages", "interval"], (data) => {
  if (data.groupUrls) groupUrlsInput.value = data.groupUrls;
  if (data.messages) messagesInput.value = data.messages;
  if (data.interval) intervalInput.value = data.interval;
});

startBtn.onclick = () => {
  const groupUrls = groupUrlsInput.value.split("\n").map(u => u.trim()).filter(Boolean);
  const messages = messagesInput.value.split("\n").map(m => m.trim()).filter(Boolean);
  const intervalMinutes = parseInt(intervalInput.value);

  if (groupUrls.length === 0 || messages.length === 0 || isNaN(intervalMinutes) || intervalMinutes < 1) {
    statusDiv.textContent = "Please fill all fields correctly.";
    return;
  }

  chrome.storage.sync.set({groupUrls: groupUrlsInput.value, messages: messagesInput.value, interval: intervalMinutes});

  chrome.runtime.sendMessage({
    action: "startPosting",
    intervalMinutes,
    messages,
  }, (response) => {
    statusDiv.textContent = "Started posting.";
  });
};

stopBtn.onclick = () => {
  chrome.runtime.sendMessage({action: "stopPosting"}, (response) => {
    statusDiv.textContent = "Stopped posting.";
  });
};
