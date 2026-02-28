// Shared hook: wraps menu queries + react-query
// Re-exports the existing useMenus hook which is already React Native compatible
// (uses @tanstack/react-query + supabase — no web APIs)

export { useMenus } from '@/hooks/useMenus';
