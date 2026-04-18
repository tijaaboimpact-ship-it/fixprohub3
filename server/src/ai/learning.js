const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../../data/ai_cases.json');

/**
 * Validates successful repairs, common failures, device issues
 * Extends the AI learning map
 */
function logRepairCase(deviceModel, errorType, repairMethod, success) {
  let cases = [];
  try {
    const data = fs.readFileSync(casesPath, 'utf8');
    cases = JSON.parse(data);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const existingCase = cases.find(
    c => c.device_model === deviceModel && c.error_type === errorType && c.repair_method === repairMethod
  );

  if (existingCase) {
    // Basic AI learning algo calculation
    // Success rate is a moving average simulation 
    let currentRating = existingCase.success_rate || 50;
    if (success) {
      existingCase.success_rate = Math.min(100, currentRating + 2); // increases success rank
    } else {
      existingCase.success_rate = Math.max(0, currentRating - 5);  // decreases it significantly stringently on failure
    }
  } else {
    // Create new knowledge rule
    cases.push({
      device_model: deviceModel,
      error_type: errorType,
      repair_method: repairMethod,
      success_rate: success ? 100 : 0
    });
  }

  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), 'utf8');
}

/**
 * Recommends repair options sorted by AI knowledge weighting
 */
function suggestRepairMethod(deviceModel, errorType) {
  // Read dynamically bypassing require cache
  let cases = [];
  try {
    const data = fs.readFileSync(casesPath, 'utf8');
    cases = JSON.parse(data);
  } catch(err) {}

  const dModel = (deviceModel || "").toLowerCase().trim();
  const eType = (errorType || "").toLowerCase().trim();

  const matches = cases.filter(c => {
    const dbModel = (c.device_model || "").toLowerCase();
    const dbErr = (c.error_type || "").toLowerCase();
    // Case insensitive partial matching
    return dbModel.includes(dModel) && dbErr.includes(eType);
  });
  
  if (matches.length === 0) return [{ method: "No AI solutions known. Please search forums.", success_rate: 0 }];

  // Return highest success method first
  return matches.sort((a, b) => b.success_rate - a.success_rate).map(c => ({
    method: c.repair_method,
    success_rate: c.success_rate
  }));
}

module.exports = { logRepairCase, suggestRepairMethod };
