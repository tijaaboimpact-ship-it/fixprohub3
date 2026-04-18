/**
 * AI Flashing Assistant Module
 * Guides technicians, performs validation, and warns users.
 */

// Basic simulation of a pre-flash validation check
function validatePreFlash(deviceInfo, firmwareInfo) {
  let warnings = [];
  let errors = [];
  let pass = true;

  // 1. Incorrect Firmware Check
  if (deviceInfo.device_name !== firmwareInfo.device_name) {
    errors.push("FIRMWARE MISMATCH: Attempting to flash incorrect firmware model.");
    pass = false;
  }

  // 2. Data Loss Risks
  if (firmwareInfo.wipe_data || firmwareInfo.android_version < deviceInfo.current_android_version) {
    warnings.push("DATA LOSS RISK: This firmware will likely format the device or cause a soft-brick due to downgrade.");
  }

  // 3. Bootloader Mismatch (Example logic)
  const fwBinary = extractBinaryVersion(firmwareInfo.firmware_version);
  const devBinary = extractBinaryVersion(deviceInfo.current_firmware);

  if (fwBinary < devBinary) {
    errors.push("BOOTLOADER MISMATCH: Downgrading binary is not allowed. SW REV CHECK FAIL.");
    pass = false;
  }

  return { pass, warnings, errors };
}

function extractBinaryVersion(buildCode) {
  // Logic to get Bit/Binary from Samsung firmware e.g. S918BXXU1AWBD -> 1
  return parseInt(buildCode.replace(/\D/g, ''), 10) || 1;
}

module.exports = { validatePreFlash };
