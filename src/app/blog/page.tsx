import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { defaultWhatsappHref } from "@/components/landing/landing-data";
import { siteNavLinks } from "@/components/navigation/nav-links";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { Reveal } from "@/components/landing/reveal";
import {
  formatBlogDate,
  getAllBlogPosts,
  getBlogPostPath,
} from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const pagePath = "/blog";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-blog-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Siargao Guides and Travel Tips | Siargao Rides Blog",
  description:
    "Practical, local-first guides on getting around Siargao, places to visit, food spots, and easy trip planning tips.",
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: "Siargao Guides and Travel Tips | Siargao Rides Blog",
    description:
      "Practical, local-first guides on getting around Siargao, places to visit, food spots, and easy trip planning tips.",
    url: absoluteUrl(pagePath),
    type: "website",
    images: [
      {
        url: absoluteUrl("/blog/placeholders/airport-transfer-guide-hero.png"),
        width: 1200,
        height: 630,
        alt: "Siargao travel guides and tips",
      },
    ],
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const [featuredPost, ...latestPosts] = posts;

  return (
    <>
      <SiteNavbar whatsappHref={defaultWhatsappHref} />

      <main className={newsreader.variable}>
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <Reveal>
              <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-600">
                Editorial Guides
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-5 max-w-4xl text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl [font-family:var(--font-blog-serif)]">
                Siargao Guides That Make Travel Feel Easy
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
                Short, practical field notes on where to go, how to move around,
                and how to plan smoother days around Siargao.
              </p>
            </Reveal>
          </div>
        </header>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            {featuredPost ? (
              <Reveal>
                <Link
                  href={getBlogPostPath(featuredPost.slug)}
                  className="group block overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 transition-shadow hover:shadow-md"
                >
                  <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px]">
                      <Image
                        src={featuredPost.heroImage}
                        alt={featuredPost.heroImageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 700px"
                        priority
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                        {featuredPost.category}
                      </p>
                      <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                        {featuredPost.title}
                      </h2>
                      <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
                        {featuredPost.excerpt}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500 sm:text-sm">
                        <span>{formatBlogDate(featuredPost.publishedAt)}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {featuredPost.readingTimeMinutes} min read
                        </span>
                      </div>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        Read guide
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ) : null}
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                Latest Guides
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {latestPosts.map((post, index) => (
                <Reveal key={post.slug} delay={0.06 + index * 0.05}>
                  <Link
                    href={getBlogPostPath(post.slug)}
                    className="group block overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                      <Image
                        src={post.heroImage}
                        alt={post.heroImageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 540px"
                      />
                    </div>
                    <p className="mt-5 text-xs font-medium tracking-wide text-slate-500 uppercase">
                      {post.category}
                    </p>
                    <h3 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-slate-900 [font-family:var(--font-blog-serif)]">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 sm:text-sm">
                      <span>{formatBlogDate(post.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {post.readingTimeMinutes} min read
                      </span>
                    </div>
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
            <p className="text-xs text-slate-400">Helpful local guides for Siargao trips.</p>
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
    </>
  );
}
