// Build-time flag indicating the SPA is built with VITE_ENABLE_MOCKS=true.
//
// IMPORTANT: do not import this constant if your goal is dead-code
// elimination at the call site. Rollup does not propagate the
// constant value across module boundaries reliably, so importing
// `useMocks` keeps the gated imports alive in the bundle.
//
// For dead-code elimination, write the check inline:
//
//   if (import.meta.env.VITE_ENABLE_MOCKS === 'true') { ... }
//
// Vite substitutes `import.meta.env.VITE_ENABLE_MOCKS` at parse time,
// so the resulting `if ('true' === 'true')` or `if (undefined === 'true')`
// constant-folds away, and any imports referenced only inside the dead
// branch are tree-shaken.
//
// This re-export is kept as documentation of the convention and for
// the few call sites where runtime branching (without DCE) is fine.
export const useMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true'
