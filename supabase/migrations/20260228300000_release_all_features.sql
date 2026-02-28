-- ============================================================================
-- Release All Features for Beta
-- ============================================================================
-- Flips every module in feature_releases from 'development' to 'released'
-- so that all nav items become active in the chef sidebar.

UPDATE feature_releases
SET status = 'released', released_at = now()
WHERE status = 'development';
