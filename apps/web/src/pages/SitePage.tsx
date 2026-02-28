import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import chefLogo from "@/assets/chefos-logo-new.png";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";

interface SitePageProps {
  slug?: string;
}

const SitePage = ({ slug: propSlug }: SitePageProps) => {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  const seoKey = `/${slug}` as keyof typeof SEO;
  useSEO(SEO[seoKey] || { title: `${slug} — ChefOS`, description: "ChefOS — Kitchen Operating System", canonical: `https://chefos.ai/${slug}` });

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["site-page", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as { id: string; slug: string; title: string; body_html: string; body_text: string; is_published: boolean; updated_at: string };
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or isn't published.</p>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={chefLogo} alt="ChefOS" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold">ChefOS</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
        <div
          className="prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.body_html }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        </div>
      </footer>
    </div>
  );
};

export default SitePage;
