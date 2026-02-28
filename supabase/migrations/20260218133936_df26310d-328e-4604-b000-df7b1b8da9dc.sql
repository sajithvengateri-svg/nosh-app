-- Fix: Allow public (anon) access to published help articles
DROP POLICY IF EXISTS "Authenticated users can read published help articles" ON public.help_articles;

CREATE POLICY "Anyone can read published help articles"
ON public.help_articles
FOR SELECT
USING (is_published = true);
