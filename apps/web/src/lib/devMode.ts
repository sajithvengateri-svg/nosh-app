// DEV_MODE — disabled for production.
export const DEV_MODE = true;

// BETA_MODE flag — prominent beta banner across the app
// Default: ON. Visit ?beta=false to disable, ?beta=true to re-enable.
const params = new URLSearchParams(window.location.search);
const betaParam = params.get('beta');

if (betaParam === 'true') {
  localStorage.setItem('chefos_beta', 'true');
} else if (betaParam === 'false') {
  localStorage.setItem('chefos_beta', 'false');
}

// Default to true (beta is on) unless explicitly disabled
export const BETA_MODE = localStorage.getItem('chefos_beta') !== 'false';
