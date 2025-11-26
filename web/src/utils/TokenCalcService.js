/**
 * Token calculation service - replicates the logic from the desktop C++ application
 */

/**
 * Calculate wear value
 * @param {number} initB - Initial balance
 * @param {number} finalB - Final balance
 * @param {string|null} wearInput - Manual wear input (if any)
 * @returns {number} Wear value
 */
export function computeWear(initB, finalB, wearInput) {
  // If manual wear input is provided and not empty, use it
  if (wearInput !== null && wearInput !== undefined && wearInput !== '') {
    return parseFloat(wearInput);
  }
  // Otherwise calculate as difference between initial and final balance
  return initB - finalB;
}

/**
 * Calculate balance points
 * @param {number} finalB - Final balance
 * @param {string|null} balancePtsInput - Manual balance points input (if any)
 * @returns {number} Balance points
 */
export function computeBalancePts(finalB, balancePtsInput) {
  // If final balance is less than 100, return 0 points
  if (finalB < 100.0) return 0;
  
  // If manual balance points input is provided and not empty, use it
  if (balancePtsInput !== null && balancePtsInput !== undefined && balancePtsInput !== '') {
    return parseInt(balancePtsInput);
  }
  
  // Otherwise calculate based on balance ranges
  if (finalB < 1000.0) return 1;
  if (finalB < 10000.0) return 2;
  if (finalB < 100000.0) return 3;
  return 4;
}

/**
 * Calculate transaction points
 * @param {number} txn - Transaction amount
 * @param {string|null} txnPtsInput - Manual transaction points input (if any)
 * @returns {number} Transaction points
 */
export function computeTxnPts(txn, txnPtsInput) {
  // If transaction amount is less than 2, return 0 points
  if (txn < 2.0) return 0;
  
  // If manual transaction points input is provided and not empty, use it
  if (txnPtsInput !== null && txnPtsInput !== undefined && txnPtsInput !== '') {
    return parseInt(txnPtsInput);
  }
  
  // Otherwise calculate using log2 formula
  return Math.floor(Math.log2(txn));
}

/**
 * Calculate gross profit
 * @param {number} qty - Quantity
 * @param {number} val - Value
 * @returns {number} Gross profit
 */
export function computeProfitGross(qty, val) {
  return qty * val;
}

/**
 * Calculate net profit
 * @param {number} profitGross - Gross profit
 * @param {number} wear - Wear value
 * @param {string|null} profitInput - Manual profit input (if any)
 * @returns {number} Net profit
 */
export function computeProfitNet(profitGross, wear, profitInput) {
  // If manual profit input is provided and not empty, use it
  if (profitInput !== null && profitInput !== undefined && profitInput !== '') {
    return parseFloat(profitInput);
  }
  
  // Otherwise calculate as gross profit minus wear
  return profitGross - wear;
}