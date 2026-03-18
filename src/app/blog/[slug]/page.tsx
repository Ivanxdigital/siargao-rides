import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, MoveLeft } from "lucide-react";

import {
  buildWhatsappHref,
  defaultWhatsappHref,
} from "@/components/landing/landing-data";
import { Reveal } from "@/components/landing/reveal";
import { siteNavLinks } from "@/components/navigation/nav-links";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { Button } from "@/components/ui/button";
import {
  formatBlogDate,
  getBlogHeadingId,
  getBlogPostBySlug,
  getBlogPostPath,
  getAllBlogPosts,
  getRelatedBlogPosts,
} from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";
import {
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
} from "@/lib/schema";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-blog-serif",
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Guide Not Found | Siargao Rides",
      description: "This guide could not be found.",
    };
  }

  const postPath = getBlogPostPath(post.slug);

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical: postPath,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: absoluteUrl(postPath),
      type: "article",
      images: [
        {
          url: absoluteUrl(post.heroImage),
          width: 1200,
          height: 630,
          alt: post.heroImageAlt,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postPath = getBlogPostPath(post.slug);
  const relatedPosts = getRelatedBlogPosts(post, 3);
  const headingBlocks = post.content.filter((block) => block.type === "heading");
  const whatsappHref = buildWhatsappHref(
    `Hi Siargao Rides, can you help me plan transport around this guide: "${post.title}"?`,
  );

  const blogPostingSchema = buildBlogPostingSchema({
    headline: post.title,
    description: post.seoDescription,
    path: postPath,
    imagePath: post.heroImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: "Siargao Rides Editorial Team",
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: postPath },
  ]);
  const faqSchema =
    post.faqItems && post.faqItems.length > 0
      ? buildFaqSchema(post.faqItems)
      : null;

  return (
    <>
      <SiteNavbar whatsappHref={defaultWhatsappHref} />

      <main className={newsreader.variable}>
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
            <Reveal>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                <MoveLeft className="h-4 w-4" />
                Back to all guides
              </Link>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:text-sm">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium tracking-wide uppercase">
                  {post.category}
                </span>
                <span>{formatBlogDate(post.publishedAt)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {post.readingTimeMinutes} min read
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="mt-6 max-w-4xl text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [font-family:var(--font-blog-serif)]">
                {post.title}
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-500 sm:text-lg">
                {post.excerpt}
              </p>
            </Reveal>

            <Reveal delay={0.18} className="mt-10">
              <figure className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                <div className="relative aspect-[16/10] sm:aspect-[16/8]">
                  <Image
                    src={post.heroImage}
                    alt={post.heroImageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 1200px"
                    priority
                  />
                </div>
              </figure>
            </Reveal>
          </div>
        </header>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
            <article className="order-2 lg:order-1">
              <Reveal>
                <div className="mb-10 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-7">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                    At a Glance
                  </h2>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {post.atAGlance.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <div className="space-y-6 text-slate-700">
                {post.content.map((block, index) => {
                  if (block.type === "heading") {
                    const headingId = getBlogHeadingId(block.text);

                    return (
                      <Reveal key={`${block.type}-${block.text}-${index}`} delay={0.03}>
                        <h2
                          id={headingId}
                          className="mt-12 text-3xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]"
                        >
                          {block.text}
                        </h2>
                      </Reveal>
                    );
                  }

                  if (block.type === "paragraph") {
                    return (
                      <Reveal key={`${block.type}-${index}`} delay={0.03}>
                        <p className="text-base leading-relaxed text-slate-700 sm:text-[17px]">
                          {block.text}
                        </p>
                      </Reveal>
                    );
                  }

                  if (block.type === "list") {
                    return (
                      <Reveal key={`${block.type}-${index}`} delay={0.03}>
                        <ul className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                          {block.items.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </Reveal>
                    );
                  }

                  if (block.type === "image") {
                    return (
                      <Reveal key={`${block.type}-${index}`} delay={0.03}>
                        <figure className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
                          <div className="relative aspect-[16/10]">
                            <Image
                              src={block.src}
                              alt={block.alt}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 760px"
                            />
                          </div>
                          <figcaption className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5 sm:text-sm">
                            {block.caption}
                          </figcaption>
                        </figure>
                      </Reveal>
                    );
                  }

                  if (block.type === "table") {
                    return (
                      <Reveal key={`${block.type}-${index}`} delay={0.03}>
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700">
                              <tr>
                                {block.headers.map((header) => (
                                  <th
                                    key={header}
                                    className="border-b border-slate-100 px-4 py-3 font-semibold"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, rowIndex) => (
                                <tr
                                  key={`${row.join("-")}-${rowIndex}`}
                                  className="align-top text-slate-700"
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={`${cell}-${cellIndex}`}
                                      className="border-t border-slate-100 px-4 py-3 leading-relaxed"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Reveal>
                    );
                  }

                  return (
                    <Reveal key={`${block.type}-${index}`} delay={0.03}>
                      <blockquote className="rounded-2xl border-l-4 border-emerald-500 bg-slate-50 px-5 py-4 text-lg leading-relaxed text-slate-800 [font-family:var(--font-blog-serif)]">
                        {block.text}
                      </blockquote>
                    </Reveal>
                  );
                })}
              </div>

              {post.faqItems && post.faqItems.length > 0 ? (
                <Reveal delay={0.08} className="mt-12 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-7">
                  <h2 className="text-3xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                    Frequently Asked Questions
                  </h2>
                  <div className="mt-6 space-y-5">
                    {post.faqItems.map((item) => (
                      <article key={item.question}>
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {item.question}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                          {item.answer}
                        </p>
                      </article>
                    ))}
                  </div>
                </Reveal>
              ) : null}
            </article>

            <aside className="order-1 space-y-5 lg:order-2">
              <div className="lg:sticky lg:top-24">
                <Reveal>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
                      On This Page
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                      {headingBlocks.map((block) => {
                        const headingId = getBlogHeadingId(block.text);

                        return (
                          <li key={headingId}>
                            <a
                              href={`#${headingId}`}
                              className="transition-colors hover:text-slate-900"
                            >
                              {block.text}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Reveal>

                <Reveal delay={0.08}>
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="text-xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                      Need transport help for this plan?
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Share your route and dates. We will reply with practical options.
                    </p>
                    <Button
                      asChild
                      className="mt-4 h-11 w-full rounded-full bg-slate-900 px-5 text-sm text-white hover:bg-slate-800"
                    >
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        Message on WhatsApp
                      </a>
                    </Button>
                  </div>
                </Reveal>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                Related Guides
              </h2>
            </Reveal>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {relatedPosts.map((relatedPost, index) => (
                <Reveal key={relatedPost.slug} delay={0.06 + index * 0.05}>
                  <Link
                    href={getBlogPostPath(relatedPost.slug)}
                    className="group block overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                      <Image
                        src={relatedPost.heroImage}
                        alt={relatedPost.heroImageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 360px"
                      />
                    </div>
                    <p className="mt-4 text-xs font-medium tracking-wide text-slate-500 uppercase">
                      {relatedPost.category}
                    </p>
                    <h3 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                      {relatedPost.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {relatedPost.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      Read guide
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-brand.png"
              alt="Siargao Rides"
              width={4139}
              height={1138}
              className="h-auto w-[152px]"
            />
            <p className="text-xs text-slate-400">Siargao travel guides and planning tips.</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {siteNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      ) : null}
    </>
  );
}
