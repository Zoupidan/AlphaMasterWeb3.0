/**
 * Summary service - replicates the logic from the desktop C++ application
 */

/**
 * Calculate balance points (local helper)
 * @param {number} balance - Balance amount
 * @returns {number} Balance points
 */
function calcBalancePointsLocal(balance) {
  if (balance < 100.0) return 0;
  if (balance < 1000.0) return 1;
  if (balance < 10000.0) return 2;
  if (balance < 100000.0) return 3;
  return 4;
}

/**
 * Calculate transaction points (local helper)
 * @param {number} amount - Transaction amount
 * @returns {number} Transaction points
 */
function calcTxnPointsLocal(amount) {
  if (amount < 2.0) return 0;
  return Math.floor(Math.log2(amount));
}

/**
 * Compute global summary
 * @param {Object} dayStore - Day store object
 * @param {Date} effToday - Effective today date
 * @returns {Object} Global summary
 */
export function computeGlobalSummary(dayStore, effToday) {
  const summary = {
    sumWear: 0,
    sumProfitTotal: 0,
    sumTxn: 0,
    sumPts: 0,
    wearRate: 0
  };

  // 15-day valid points window and 90-day transaction/wear window
  const windowStart = new Date(effToday);
  windowStart.setDate(windowStart.getDate() - 14);
  
  const windowTxnStart = new Date(effToday);
  windowTxnStart.setDate(windowTxnStart.getDate() - 89);

  // Iterate through all days in the store
  for (const key in dayStore) {
    if (!dayStore.hasOwnProperty(key)) continue;
    
    const d = new Date(key);
    const dayObj = dayStore[key];
    
    // Prefer new structure: separate calc/use arrays; fallback to old entries array
    const calcArr = dayObj.calc || [];
    const useArr = dayObj.use || [];
    const hasNew = (calcArr.length > 0 || useArr.length > 0);
    const entries = hasNew ? [] : (dayObj.entries || []);

    let dayWearSum = 0.0;
    let dayProfitGrossSum = 0.0;
    let dayTxnSum = 0.0;
    let dayUsedPtsTotal = 0;
    let minFinalBalance = Infinity;
    let hasCalc = false;

    if (hasNew) {
      // Process calc entries
      for (const entry of calcArr) {
        const wear = parseFloat(entry.wear) || 0;
        dayWearSum += (wear > 0 ? wear : 0.0);
        
        const finalBalance = parseFloat(entry.finalBalance) || 0;
        const transaction = parseFloat(entry.transaction) || 0;
        
        if (transaction > 0.0) dayTxnSum += transaction;
        if (finalBalance > 0.0) {
          minFinalBalance = Math.min(minFinalBalance, finalBalance);
          hasCalc = true;
        }
      }
      
      // Process use entries
      for (const entry of useArr) {
        const tokenQty = parseFloat(entry.tokenQty) || 0;
        const tokenVal = parseFloat(entry.tokenVal) || 0;
        const profitGross = entry.profitGross !== undefined ? 
          parseFloat(entry.profitGross) : (tokenQty * tokenVal);
          
        dayProfitGrossSum += profitGross;
        dayUsedPtsTotal += parseInt(entry.usedPts) || 0;
      }
    } else if (entries.length === 0) {
      // Handle old data format (single entry, processed by daily aggregation rules)
      const initBalance = parseFloat(dayObj.initBalance) || 0;
      const finalBalance = parseFloat(dayObj.finalBalance) || 0;
      const transaction = parseFloat(dayObj.transaction) || 0;
      const usedPts = parseInt(dayObj.usedPts) || 0;
      
      const wear = initBalance - finalBalance;
      const tokenQty = parseFloat(dayObj.tokenQty) || 0;
      const tokenVal = parseFloat(dayObj.tokenVal) || 0;
      const profitGross = dayObj.profit !== undefined ? 
        parseFloat(dayObj.profit) : (tokenQty * tokenVal);
        
      dayWearSum += (wear > 0 ? wear : 0.0);
      dayProfitGrossSum += profitGross;
      
      if (transaction > 0.0) dayTxnSum += transaction;
      if (finalBalance > 0.0) {
        minFinalBalance = finalBalance;
        hasCalc = true;
      }
      
      dayUsedPtsTotal += usedPts;
    } else {
      // Process entries array
      for (const entry of entries) {
        const type = entry.entryType || "";
        
        // Only count wear for non-use entries to avoid double deduction
        if (type !== "use") {
          const wear = parseFloat(entry.wear) || 0;
          dayWearSum += (wear > 0 ? wear : 0.0);
        }
        
        if (type === "use") {
          const tokenQty = parseFloat(entry.tokenQty) || 0;
          const tokenVal = parseFloat(entry.tokenVal) || 0;
          const profitGross = entry.profitGross !== undefined ? 
            parseFloat(entry.profitGross) : (tokenQty * tokenVal);
            
          dayProfitGrossSum += profitGross;
          dayUsedPtsTotal += parseInt(entry.usedPts) || 0;
        } else {
          const finalBalance = parseFloat(entry.finalBalance) || 0;
          const transaction = parseFloat(entry.transaction) || 0;
          
          if (transaction > 0.0) dayTxnSum += transaction;
          if (finalBalance > 0.0) {
            minFinalBalance = Math.min(minFinalBalance, finalBalance);
            hasCalc = true;
          }
        }
      }
    }

    // Accumulate wear/total transactions/gross profit (within 90-day window)
    if (d instanceof Date && !isNaN(d.getTime()) && 
        d >= windowTxnStart && d <= effToday) {
      summary.sumWear += dayWearSum;
      summary.sumTxn += dayTxnSum;
      summary.sumProfitTotal += dayProfitGrossSum;
    }

    // 15-day window valid points: transaction points + minimum balance points - used points
    if (d instanceof Date && !isNaN(d.getTime()) && 
        d >= windowStart && d <= effToday) {
      let dayPts = 0;
      
      if (hasCalc && minFinalBalance >= 100.0) {
        const bp = calcBalancePointsLocal(minFinalBalance);
        const tp = calcTxnPointsLocal(dayTxnSum);
        dayPts = bp + tp - dayUsedPtsTotal;
      } else {
        // No calc entries or balance too low: only deduct used points
        dayPts = -dayUsedPtsTotal;
      }
      
      summary.sumPts += dayPts;
    }
  }

  // Total profit = window gross profit sum - window wear sum
  summary.sumProfitTotal = summary.sumProfitTotal - summary.sumWear;
  
  // Wear rate
  summary.wearRate = (summary.sumTxn > 0.0) ? (summary.sumWear / summary.sumTxn) : 0.0;
  
  return summary;
}

/**
 * Compute today's stats
 * @param {Object} dayStore - Day store object
 * @param {Date} date - Date to compute stats for
 * @returns {Object} Today's stats
 */
export function computeTodayStats(dayStore, date) {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const todayStats = {
    dateKey: dateKey,
    empty: false,
    initBalance: 0,
    finalBalance: 0,
    wear: 0,
    balancePts: 0,
    txnPts: 0,
    totalPts: 0,
    tokenLines: [],
    profitNet: 0
  };

  const dayObj = dayStore[dateKey] || {};
  
  // Prefer new structure: separate calc/use arrays; fallback to old entries array
  const calcArr = dayObj.calc || [];
  const useArr = dayObj.use || [];
  const hasNew = (calcArr.length > 0 || useArr.length > 0);
  const entries = hasNew ? [] : (dayObj.entries || []);
  
  if ((!hasNew && entries.length === 0) && Object.keys(dayObj).length === 0) {
    todayStats.empty = true;
    return todayStats;
  }

  // Daily aggregation: sum transactions, min final balance, sum wear, sum used points, profit as sum of use gross profits
  let dayWearSum = 0.0;
  let dayTxnSum = 0.0;
  let dayUsedPtsTotal = 0;
  let minFinalBalance = Infinity;
  let initOfMinFinal = 0.0;
  let profitGrossSum = 0.0;
  let hasCalc = false;

  if (hasNew) {
    // Process calc entries
    for (const entry of calcArr) {
      const wear = parseFloat(entry.wear) || 0;
      dayWearSum += (wear > 0 ? wear : 0.0);
      
      const finalBalance = parseFloat(entry.finalBalance) || 0;
      const initBalance = parseFloat(entry.initBalance) || 0;
      const transaction = parseFloat(entry.transaction) || 0;
      
      if (transaction > 0.0) dayTxnSum += transaction;
      if (finalBalance > 0.0) {
        if (finalBalance < minFinalBalance) {
          minFinalBalance = finalBalance;
          initOfMinFinal = initBalance;
        }
        hasCalc = true;
      }
    }
    
    // Process use entries
    for (const entry of useArr) {
      const tokenQty = parseFloat(entry.tokenQty) || 0;
      const tokenVal = parseFloat(entry.tokenVal) || 0;
      const profitGross = entry.profitGross !== undefined ? 
        parseFloat(entry.profitGross) : (tokenQty * tokenVal);
        
      profitGrossSum += profitGross;
      dayUsedPtsTotal += parseInt(entry.usedPts) || 0;
    }
  } else if (entries.length === 0) {
    // Handle old data format
    const initBalance = parseFloat(dayObj.initBalance) || 0;
    const finalBalance = parseFloat(dayObj.finalBalance) || 0;
    const transaction = parseFloat(dayObj.transaction) || 0;
    const used = parseInt(dayObj.usedPts) || 0;
    
    const wear = initBalance - finalBalance;
    const tokenQty = parseFloat(dayObj.tokenQty) || 0;
    const tokenVal = parseFloat(dayObj.tokenVal) || 0;
    const profitGross = dayObj.profit !== undefined ? 
      parseFloat(dayObj.profit) : (tokenQty * tokenVal);
      
    dayWearSum += (wear > 0 ? wear : 0.0);
    
    if (transaction > 0.0) dayTxnSum += transaction;
    profitGrossSum += profitGross;
    
    if (finalBalance > 0.0) {
      minFinalBalance = finalBalance;
      initOfMinFinal = initBalance;
      hasCalc = true;
    }
    
    dayUsedPtsTotal += used;
  } else {
    // Process entries array
    for (const entry of entries) {
      const type = entry.entryType || "";
      
      // Only count wear for non-use entries
      if (type !== "use") {
        const wear = parseFloat(entry.wear) || 0;
        dayWearSum += (wear > 0 ? wear : 0.0);
      }
      
      if (type === "use") {
        const tokenQty = parseFloat(entry.tokenQty) || 0;
        const tokenVal = parseFloat(entry.tokenVal) || 0;
        const profitGross = entry.profitGross !== undefined ? 
          parseFloat(entry.profitGross) : (tokenQty * tokenVal);
          
        profitGrossSum += profitGross;
        dayUsedPtsTotal += parseInt(entry.usedPts) || 0;
      } else {
        const finalBalance = parseFloat(entry.finalBalance) || 0;
        const initBalance = parseFloat(entry.initBalance) || 0;
        const transaction = parseFloat(entry.transaction) || 0;
        
        if (transaction > 0.0) dayTxnSum += transaction;
        if (finalBalance > 0.0) {
          if (finalBalance < minFinalBalance) {
            minFinalBalance = finalBalance;
            initOfMinFinal = initBalance;
          }
          hasCalc = true;
        }
      }
    }
  }

  let balPts = 0;
  let tPts = 0;
  
  if (hasCalc && minFinalBalance >= 100.0) {
    balPts = calcBalancePointsLocal(minFinalBalance);
    tPts = calcTxnPointsLocal(dayTxnSum);
  }
  
  todayStats.initBalance = initOfMinFinal;
  todayStats.finalBalance = isFinite(minFinalBalance) ? minFinalBalance : 0.0;
  todayStats.wear = dayWearSum;
  todayStats.balancePts = balPts;
  todayStats.txnPts = tPts;
  todayStats.totalPts = balPts + tPts - dayUsedPtsTotal;

  // Token names: deduplicated recent use list, fallback to recent use or calc
  let latestEntry = {};
  let useForTokens = [];
  
  if (hasNew) {
    useForTokens = useArr;
    latestEntry = useArr.length > 0 ? useArr[useArr.length - 1] : {};
  } else {
    // Old structure: pass all entries, filtering by entryType internally
    useForTokens = entries;
    latestEntry = entries.length > 0 ? entries[entries.length - 1] : dayObj;
  }
  
  // Import collectUseTokenLines function
  // We'll need to handle this differently since we can't import here
  todayStats.tokenLines = collectUseTokenLines(useForTokens, latestEntry); // Use the local function

  // Profit: sum of all use entry gross profits - daily total wear
  todayStats.profitNet = profitGrossSum - dayWearSum;

  return todayStats;
}

// Add the collectUseTokenLines function here to avoid import issues
/**
 * Collect token names from entries
 * @param {Array} entriesOrUse - Entries or use array
 * @param {Object} latestEntry - Latest entry
 * @returns {Array} Token names
 */
function collectUseTokenLines(entriesOrUse, latestEntry) {
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
