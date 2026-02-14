'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { useState, useEffect } from 'react';
import { getImageLink } from '@/lib/image-cache';
import { isImageFile, getParentPath } from '@/lib/utils';
import { Loader2, ExternalLink } from 'lucide-react';

function DropboxImage({ src, alt, basePath }: { src?: string; alt?: string; basePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // If it's already an absolute URL, use as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      setUrl(src);
      return;
    }

    // Resolve relative path
    const parentDir = getParentPath(basePath);
    const fullPath = src.startsWith('/') ? src : `${parentDir}/${src}`;

    getImageLink(fullPath)
      .then(setUrl)
      .catch(() => setError(true));
  }, [src, basePath]);

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm rounded">
        Image not found: {src}
      </span>
    );
  }

  if (!url) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded">
        <Loader2 size={14} className="animate-spin" />
        Loading image…
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt || ''}
      className="max-w-full rounded-lg shadow-sm"
      loading="lazy"
    />
  );
}

interface MarkdownPreviewProps {
  content: string;
  basePath: string;
  onNavigate?: (path: string) => void;
}

export function MarkdownPreview({ content, basePath, onNavigate }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-6 overflow-y-auto h-full
      prose-headings:text-gray-900 dark:prose-headings:text-gray-100
      prose-a:text-violet-600 dark:prose-a:text-violet-400
      prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-pre:bg-gray-900 dark:prose-pre:bg-[#181825] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-[#313244]
      prose-img:rounded-lg prose-img:shadow-sm
      prose-table:border-collapse
      prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-50 dark:prose-th:bg-gray-800
      prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-3 prose-td:py-2
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          img: (props) => {
            const src = typeof props.src === 'string' ? props.src : undefined;
            const alt = typeof props.alt === 'string' ? props.alt : undefined;
            return <DropboxImage src={src} alt={alt} basePath={basePath} />;
          },
          a: (props) => {
            const href = typeof props.href === 'string' ? props.href : undefined;
            const { children } = props;
            // Handle internal links (.md files)
            if (href && !href.startsWith('http') && isImageFile(href) === false && href.endsWith('.md')) {
              return (
                <button
                  onClick={() => {
                    const parentDir = getParentPath(basePath);
                    const fullPath = href.startsWith('/') ? href : `${parentDir}/${href}`;
                    onNavigate?.(fullPath);
                  }}
                  className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                {children}
                <ExternalLink size={12} className="inline" />
              </a>
            );
          },
          input: (props) => {
            if (props.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={props.checked}
                  readOnly
                  className="mr-1 rounded accent-violet-600"
                />
              );
            }
            return <input type={props.type} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
