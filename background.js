let postIntervalId = null;

// Listen for commands from popup to start/stop posting
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startPosting") {
    if (postIntervalId) clearInterval(postIntervalId);

    const interval = request.intervalMinutes * 60 * 1000;
    postIntervalId = setInterval(() => {
      // Query all tabs with Roblox groups URL
      chrome.tabs.query({url: "https://www.roblox.com/groups/*"}, (tabs) => {
        tabs.forEach(tab => {
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ["content.js"]
          }, () => {
            chrome.tabs.sendMessage(tab.id, {
              action: "postMessage",
              groupId: extractGroupId(tab.url),
              messages: request.messages
            });
          });
        });
      });
    }, interval);
    sendResponse({status: "started"});
  } else if (request.action === "stopPosting") {
    if (postIntervalId) clearInterval(postIntervalId);
    sendResponse({status: "stopped"});
  }
});

function extractGroupId(url) {
  const match = url.match(/groups\/(\d+)/);
  return match ? match[1] : null;
}
