-- Shorten "Food Safety" to "Safety" in bottom nav so it fits on one line
UPDATE mobile_nav_sections SET label = 'Safety' WHERE section_key = 'safety' AND label = 'Food Safety';
