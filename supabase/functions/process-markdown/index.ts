// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Configure function to allow unauthenticated access
export const config = {
  verify_jwt: false,
};

interface Frontmatter {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  tags: string[];
}

interface ProcessedMarkdown {
  content: string;
  frontmatter: Frontmatter | null;
}

interface ArticleData {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: string;
  status: "draft" | "published" | "archived";
  markdown_content: string;
  html_content: string | null;
  date: string;
}

interface TagRecord {
  id: string;
  name: string;
}

function parseFrontmatter(content: string): ProcessedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      content,
      frontmatter: null,
    };
  }

  const [, frontmatterStr, mainContent] = match;
  const frontmatter: Frontmatter = {
    title: "",
    excerpt: "",
    category: "",
    date: "",
    tags: [],
  };

  // Parse frontmatter fields
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    if (key === "title") frontmatter.title = value.replace(/^"|"$/g, "");
    else if (key === "excerpt") frontmatter.excerpt = value.replace(/^"|"$/g, "");
    else if (key === "category") frontmatter.category = value.replace(/^"|"$/g, "");
    else if (key === "date") frontmatter.date = value.replace(/^"|"$/g, "");
    else if (key === "tags") {
      try {
        frontmatter.tags = JSON.parse(value);
      } catch {
        frontmatter.tags = [];
      }
    }
  }

  return {
    frontmatter,
    content: mainContent.trim(),
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { markdown, filename } = await req.json();

    if (!markdown || typeof markdown !== "string") {
      return new Response(JSON.stringify({ error: "Markdown content is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Parse the markdown content
    const { content, frontmatter } = parseFrontmatter(markdown);

    // Prepare article data
    const title =
      frontmatter?.title || filename?.replace(/\.(md|markdown)$/, "") || "Untitled Article";
    const excerpt = frontmatter?.excerpt || "No excerpt provided";
    const category = frontmatter?.category || "Uncategorized";
    const date = frontmatter?.date || new Date().toISOString();
    const tags = frontmatter?.tags || [];
    const slug = generateSlug(title);
    const readTime = estimateReadTime(content);

    const articleData: ArticleData = {
      title,
      slug,
      excerpt,
      category,
      read_time: readTime,
      status: "draft",
      markdown_content: content,
      html_content: null,
      date,
    };

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert(articleData)
      .select()
      .single();

    if (articleError) {
      throw articleError;
    }

    // Handle tags if they exist
    if (tags.length > 0) {
      // Ensure all tags exist
      const { data: existingTags, error: tagsError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);

      if (tagsError) throw tagsError;

      const existingTagNames = new Set(existingTags.map((t: TagRecord) => t.name));
      const newTags = tags.filter((name) => !existingTagNames.has(name));

      if (newTags.length > 0) {
        const { data: insertedTags, error: insertError } = await supabase
          .from("tags")
          .insert(newTags.map((name) => ({ name })))
          .select();

        if (insertError) throw insertError;
        existingTags.push(...insertedTags);
      }

      // Create article-tag relationships
      const { error: relationError } = await supabase.from("article_tags").insert(
        existingTags.map((tag: TagRecord) => ({
          article_id: article.id,
          tag_id: tag.id,
        }))
      );

      if (relationError) throw relationError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
        },
        processed: {
          title,
          excerpt,
          category,
          tags,
          readTime,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error processing markdown:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process markdown",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-markdown' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"markdown":"---\ntitle: \"Test Article\"\nexcerpt: \"This is a test\"\ncategory: \"Test\"\ndate: \"2024-01-01\"\ntags: [\"test\", \"demo\"]\n---\n\n# Test Article\n\nThis is the content.", "filename": "test.md"}'

*/
