// Listen for navigation events
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Check if extension is enabled
  const statusResult = await chrome.storage.sync.get(['extensionEnabled']);
  if (statusResult.extensionEnabled === false) return;
  
  // Get keywords from storage
  const result = await chrome.storage.sync.get(['keywords']);
  const keywords = result.keywords || [];
  
  if (keywords.length === 0) return;
  
  // Check if the URL or title contains any of the keywords
  const url = details.url.toLowerCase();
  const title = details.title ? details.title.toLowerCase() : '';
  
  const containsKeyword = keywords.some(keyword => 
    url.includes(keyword.toLowerCase()) || title.includes(keyword.toLowerCase())
  );
  
  if (containsKeyword) {
    // Delete the history entry for this URL
    try {
      await chrome.history.deleteUrl({ url: details.url });
      console.log(`Deleted history for: ${details.url}`);
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  }
});

// Listen for history additions and remove them if they contain keywords
chrome.history.onVisited.addListener(async (historyItem) => {
  // Check if extension is enabled
  const statusResult = await chrome.storage.sync.get(['extensionEnabled']);
  if (statusResult.extensionEnabled === false) return;
  
  const result = await chrome.storage.sync.get(['keywords']);
  const keywords = result.keywords || [];
  
  if (keywords.length === 0) return;
  
  const url = historyItem.url.toLowerCase();
  const title = historyItem.title ? historyItem.title.toLowerCase() : '';
  
  const containsKeyword = keywords.some(keyword => 
    url.includes(keyword.toLowerCase()) || title.includes(keyword.toLowerCase())
  );
  
  if (containsKeyword) {
    // Delete the history entry
    try {
      await chrome.history.deleteUrl({ url: historyItem.url });
      console.log(`Prevented history for: ${historyItem.url}`);
    } catch (error) {
      console.error('Error preventing history:', error);
    }
  }
});
