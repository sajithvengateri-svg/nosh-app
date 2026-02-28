-- Create team_posts table for social feed
CREATE TABLE public.team_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_avatar_url TEXT,
  content TEXT,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'message',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_reactions table for likes/reactions
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create post_comments table for comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.team_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_posts
CREATE POLICY "Anyone can view team posts"
  ON public.team_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.team_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own posts"
  ON public.team_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.team_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Head chefs can manage all posts"
  ON public.team_posts FOR ALL
  USING (is_head_chef(auth.uid()));

-- RLS policies for post_reactions
CREATE POLICY "Anyone can view reactions"
  ON public.post_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their own reactions"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for post_comments
CREATE POLICY "Anyone can view comments"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Head chefs can manage all comments"
  ON public.post_comments FOR ALL
  USING (is_head_chef(auth.uid()));

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Storage policies for post images
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);