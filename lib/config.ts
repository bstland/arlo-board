export const DROPBOX_ROOT_PATH = process.env.DROPBOX_ROOT_PATH || '/clawd';

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
export const MARKDOWN_EXTENSIONS = ['md', 'mdx'];
export const TEXT_EXTENSIONS = ['md', 'mdx', 'txt', 'json', 'yml', 'yaml', 'toml', 'csv', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx'];

export const AUTO_SAVE_DELAY_MS = 2000;
export const IMAGE_LINK_TTL_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours
