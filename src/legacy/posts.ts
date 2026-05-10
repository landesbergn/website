import diagrammerBody from './2017-10-17-thinking-in-systems-with-diagrammer.html?raw';
import rhymerBody from './2017-12-23-introducing-rhymer.html?raw';
import replyAllBody from './2019-02-02-web-scraping-reply-all-transcripts.html?raw';

export interface HeadAsset {
  type: 'script' | 'style';
  href: string;
}

export interface FrozenPost {
  slug: string;
  url: string;
  title: string;
  date: Date;
  description: string;
  body: string;
  headAssets: HeadAsset[];
}

export const frozenPosts: FrozenPost[] = [
  {
    slug: 'web-scraping-reply-all-transcripts',
    url: '/blog/post/web-scraping-reply-all-transcripts/',
    title: 'Web scraping Reply All transcripts',
    date: new Date('2019-02-02'),
    description: 'Scraping every Reply All episode transcript with rvest, then exploring the corpus with tidytext.',
    body: replyAllBody,
    headAssets: [
      { type: 'script', href: '/rmarkdown-libs/kePrint/kePrint.js' },
    ],
  },
  {
    slug: 'introducing-rhymer',
    url: '/blog/post/introducing-rhymer/',
    title: 'Introducing rhymer',
    date: new Date('2017-12-23'),
    description: 'Announcing rhymer, an R package that wraps the Datamuse API to find rhyming words.',
    body: rhymerBody,
    headAssets: [],
  },
  {
    slug: 'thinking-in-systems-with-diagrammer',
    url: '/blog/post/thinking-in-systems-with-diagrammer/',
    title: 'Thinking in Systems with DiagrammeR',
    date: new Date('2017-10-17'),
    description: "Replicating stock-and-flow diagrams from Donella Meadows' Thinking in Systems using DiagrammeR in R.",
    body: diagrammerBody,
    headAssets: [
      { type: 'style', href: '/rmarkdown-libs/DiagrammeR-styles/styles.css' },
      { type: 'script', href: '/rmarkdown-libs/htmlwidgets/htmlwidgets.js' },
      { type: 'script', href: '/rmarkdown-libs/viz/viz.js' },
      { type: 'script', href: '/rmarkdown-libs/grViz-binding/grViz.js' },
    ],
  },
];

export const frozenPostsBySlug: Record<string, FrozenPost> = Object.fromEntries(
  frozenPosts.map((p) => [p.slug, p]),
);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Browsers don't execute <script>/parse <link> tags inserted via set:html,
// so each frozen post re-emits its head assets via the BaseLayout "head"
// slot and strips the body's copies here to avoid duplicate tags.
export function stripHeadAssets(body: string, assets: HeadAsset[]): string {
  return assets.reduce((b, asset) => {
    const escaped = escapeRegex(asset.href);
    const pattern = asset.type === 'script'
      ? new RegExp(`<script src="${escaped}"></script>\\s*`)
      : new RegExp(`<link href="${escaped}" rel="stylesheet" />\\s*`);
    return b.replace(pattern, '');
  }, body);
}
