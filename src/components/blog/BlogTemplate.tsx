"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, User, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from '@/components/animations/ScrollReveal'
import { AnimatedCard } from '@/components/animations/AnimatedCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'

interface BlogPost {
  title: string
  slug: string
  category: string
  excerpt: string
  readTime: string
  image: string
}

interface FAQ {
  question: string
  answer: string
}

interface BlogTemplateProps {
  title: string
  category: string
  readTime: string
  publishDate: string
  excerpt: string
  heroImage: string
  content: string
  faqs?: FAQ[]
  relatedPosts?: BlogPost[]
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
}

// Helper function to dedent template literal content
function dedent(str: string): string {
  const lines = str.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  if (nonEmptyLines.length === 0) return str;
  
  // Find minimum indentation
  const minIndent = Math.min(...nonEmptyLines.map(line => {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }));
  
  // Remove common indentation from all lines
  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
}

export default function BlogTemplate({
  title,
  category,
  readTime,
  publishDate,
  excerpt,
  heroImage,
  content,
  faqs = [],
  relatedPosts = []
}: BlogTemplateProps) {
  // Custom markdown renderers to match existing design
  const components: Components = {
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-xl sm:text-2xl font-semibold text-white mt-6 mb-3" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-lg font-semibold text-primary mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => {
      // Handle special checkmark formatting
      if (typeof children === 'string' && children.startsWith('✅ ')) {
        return (
          <div className="flex items-start gap-4 mb-3 p-3 bg-gray-800/30 rounded-lg border-l-4 border-primary/50" {...props}>
            <span className="text-primary text-lg flex-shrink-0 mt-0.5">✅</span>
            <span className="text-white/90 leading-relaxed">{children.substring(3)}</span>
          </div>
        )
      }
      return (
        <p className="text-white/90 mb-4 leading-relaxed" {...props}>
          {children}
        </p>
      )
    },
    ul: ({ children, ...props }) => (
      <ul className="space-y-2 mb-4" {...props}>
        {children}
      </ul>
    ),
    li: ({ children, ...props }) => {
      // Check if this is a checkmark list item
      const firstChild = Array.isArray(children) ? children[0] : children
      if (typeof firstChild === 'string' && firstChild.startsWith('✅ ')) {
        return (
          <div className="flex items-start gap-4 mb-3 p-3 bg-gray-800/30 rounded-lg border-l-4 border-primary/50" {...props}>
            <span className="text-primary text-lg flex-shrink-0 mt-0.5">✅</span>
            <span className="text-white/90 leading-relaxed">{firstChild.substring(3)}</span>
          </div>
        )
      }
      
      return (
        <li className="flex items-start gap-3 mb-2 ml-4" {...props}>
          <span className="text-primary mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
          <span className="text-white/80">{children}</span>
        </li>
      )
    },
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-white" {...props}>
        {children}
      </strong>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-white/20 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-800/50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-white/20 px-4 py-2 text-left text-white font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-white/20 px-4 py-2 text-white/80" {...props}>
        {children}
      </td>
    ),
    img: ({ src, alt, ...props }) => (
      <Image
        src={src || ''}
        alt={alt || ''}
        width={800}
        height={600}
        className="w-full max-w-2xl mx-auto h-auto rounded-lg"
        sizes="(max-width: 768px) 100vw, 800px"
        {...props}
      />
    ),
    figure: ({ children, ...props }) => (
      <figure className="my-8 sm:my-12" {...props}>
        <div className="bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto">
          {children}
        </div>
      </figure>
    ),
    figcaption: ({ children, ...props }) => (
      <figcaption className="text-center text-white/70 text-sm sm:text-base mt-4 italic font-medium" {...props}>
        {children}
      </figcaption>
    ),
  }
  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      {/* Breadcrumb Navigation */}
      <section className="pt-20 pb-4 bg-gray-900 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={14} className="text-gray-500" />
            <Link
              href="/guides"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Guides
            </Link>
            <ChevronRight size={14} className="text-gray-500" />
            <span className="text-white font-medium truncate">{title}</span>
          </nav>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <motion.div
          className="absolute inset-0 z-0 opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${heroImage}')`,
              backgroundSize: "cover"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-900/80"></div>
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            {/* Category Badge */}
            <motion.div
              className="mb-4"
              variants={slideUp}
            >
              <Badge variant="brand" className="inline-flex items-center gap-1.5 text-sm">
                {category}
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
              variants={slideUp}
            >
              {title}
            </motion.h1>

            {/* Excerpt */}
            <motion.p
              className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-6 leading-relaxed"
              variants={slideUp}
            >
              {excerpt}
            </motion.p>

            {/* Meta Information */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 text-white/60"
              variants={slideUp}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="text-sm">{readTime} read</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span className="text-sm">Siargao Rides Team</span>
              </div>
              <div className="text-sm">
                {publishDate}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Article Content */}
            <ScrollReveal>
              <div className="prose prose-lg prose-invert max-w-none">
                <div className="text-white/90 leading-relaxed space-y-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                  >
                    {dedent(content)}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollReveal>

            {/* Call to Action */}
            <ScrollReveal className="mt-12 sm:mt-16">
              <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Ready to Find Your Perfect Ride?
                  </h3>
                  <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                    Browse verified rental shops in Siargao and compare prices from trusted local providers. Book online with flexible pickup options.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
                      <Link href="/browse">
                        Browse Vehicles <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                      <Link href="/browse/shops">
                        View Rental Shops
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-12 sm:py-16 bg-black">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
                  Frequently Asked Questions
                </h2>
              </ScrollReveal>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <ScrollReveal key={index} delay={index * 100}>
                    <AnimatedCard
                      enableGlow={true}
                      glowColor="rgba(45, 212, 191, 0.1)"
                      className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                    >
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-white/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </AnimatedCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
                  Related Guides
                </h2>
              </ScrollReveal>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {relatedPosts.map((post, index) => (
                  <ScrollReveal key={post.slug} delay={index * 150}>
                    <AnimatedCard
                      enableMagnetic={true}
                      enableTilt={true}
                      enableGlow={true}
                      glowColor="rgba(45, 212, 191, 0.15)"
                      href={`/guides/${post.slug}`}
                      className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden group"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      
                      <div className="p-6">
                        <Badge variant="motorcycle" className="mb-3">
                          {post.category}
                        </Badge>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center text-white/60 text-sm">
                          <Clock size={14} className="mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                    </AnimatedCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}