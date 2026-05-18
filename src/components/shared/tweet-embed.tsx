"use client";

import { ExternalLink } from "lucide-react";

interface TweetEmbedProps {
  tweetUrl: string;
  tweetAuthor?: string;
  description?: string;
}

export function TweetEmbed({
  tweetUrl,
  tweetAuthor,
  description,
}: TweetEmbedProps) {
  return (
    <div className="w-full rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-foreground"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {tweetAuthor && (
            <span className="text-[12px] font-medium text-muted-foreground">
              {tweetAuthor}
            </span>
          )}
        </div>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          View on X
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {description && (
        <p className="text-[13px] leading-relaxed line-clamp-4">
          {description}
        </p>
      )}
    </div>
  );
}
