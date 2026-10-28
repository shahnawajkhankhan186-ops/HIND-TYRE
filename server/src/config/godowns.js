/**
 * Two-Godown Configuration & Constants
 * Default Codes: G1, G2
 * Default Names: Godown 1, Godown 2
 */

const DEFAULT_GODOWNS = [
  { code: 'G1', name: 'Godown 1' },
  { code: 'G2', name: 'Godown 2' },
];

const VALID_GODOWN_CODES = ['G1', 'G2'];

/**
 * Check if a godown code is valid
 */
function isValidGodown(code) {
  return VALID_GODOWN_CODES.includes(code);
}

/**
 * Get human-readable godown name from shop settings or defaults
 */
function getGodownName(code, shopSettings = null) {
  const godownsList = shopSettings?.godowns?.length ? shopSettings.godowns : DEFAULT_GODOWNS;
  const match = godownsList.find(g => g.code === code);
  return match ? match.name : (code === 'G2' ? 'Godown 2' : 'Godown 1');
}

module.exports = {
  DEFAULT_GODOWNS,
  VALID_GODOWN_CODES,
  isValidGodown,
  getGodownName,
};
