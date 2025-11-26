/**
 * Points service - replicates the logic from the desktop C++ application
 */

/**
 * Compute status text based on date
 * @param {Date} selectedDate - Selected date
 * @param {Date} effToday - Effective today date
 * @returns {string} Status text ("有效" or "过期")
 */
export function computeStatus(selectedDate, effToday) {
  if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
    return "过期";
  }
  
  // Calculate 14 days ago from effective today
  const windowStart = new Date(effToday);
  windowStart.setDate(windowStart.getDate() - 14);
  
  // Check if selected date is within the valid window
  if (selectedDate >= windowStart && selectedDate <= effToday) {
    return "有效";
  } else {
    return "过期";
  }
}

/**
 * Compute status number based on date
 * @param {Date} selectedDate - Selected date
 * @param {Date} effToday - Effective today date
 * @returns {number} Status number (1 for valid, 0 for expired)
 */
export function computeStatusNum(selectedDate, effToday) {
  if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
    return 0;
  }
  
  // Calculate 14 days ago from effective today
  const windowStart = new Date(effToday);
  windowStart.setDate(windowStart.getDate() - 14);
  
  // Check if selected date is within the valid window
  if (selectedDate >= windowStart && selectedDate <= effToday) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * Collect token names from entries
 * @param {Array} entriesOrUse - Entries or use array
 * @param {Object} latestEntry - Latest entry
 * @returns {Array} Token names
 */
export function collectUseTokenLines(entriesOrUse, latestEntry) {
  // Helper function to check if an entry is a "use" type
  const isUseLike = (entry) => {
    const type = entry.entryType;
    if (type !== undefined && type !== null && type !== '') {
      return type === "use";
    }
    // No entryType: treat as use if it has token fields
    return entry.tokenName !== undefined || 
           entry.tokenQty !== undefined || 
           entry.tokenVal !== undefined || 
           entry.usedPts !== undefined || 
           entry.profitGross !== undefined;
  };

  let latestUseToken = "";
  // Find the latest used token
  for (let i = entriesOrUse.length - 1; i >= 0; --i) {
    const entry = entriesOrUse[i];
    if (isUseLike(entry)) {
      latestUseToken = (entry.tokenName || "").toUpperCase();
      if (latestUseToken !== "") break;
    }
  }

  const tokenLines = [];
  const seen = new Set();
  
  // Add the latest used token if available
  if (latestUseToken !== "") {
    tokenLines.push(latestUseToken);
    seen.add(latestUseToken);
  }
  
  // Collect up to 6 unique token names from recent use entries
  for (let i = entriesOrUse.length - 1; i >= 0 && tokenLines.length < 6; --i) {
    const entry = entriesOrUse[i];
    if (!isUseLike(entry)) continue;
    
    const tokenName = (entry.tokenName || "").toUpperCase();
    if (tokenName === "" || seen.has(tokenName)) continue;
    
    tokenLines.push(tokenName);
    seen.add(tokenName);
  }
  
  // Fallback to latest entry if no tokens collected
  if (tokenLines.length === 0 && latestEntry) {
    const tokenName = (latestEntry.tokenName || "").toUpperCase();
    if (tokenName !== "") {
      tokenLines.push(tokenName);
    }
  }
  
  return tokenLines;
}