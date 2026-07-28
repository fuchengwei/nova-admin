const ALLOWED_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  's',
  'del',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'hr',
  'br',
]);
const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math']);
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const SAFE_TEXT_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

function sanitizeNode(node: Node, document: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  if (BLOCKED_TAGS.has(tagName)) return null;

  const output = ALLOWED_TAGS.has(tagName)
    ? document.createElement(tagName)
    : document.createDocumentFragment();

  if (tagName === 'a' && output instanceof HTMLAnchorElement) {
    const href = element.getAttribute('href')?.trim();
    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        if (SAFE_LINK_PROTOCOLS.has(url.protocol)) {
          output.href = url.href;
          output.target = '_blank';
          output.rel = 'noopener noreferrer';
        }
      } catch {
        // 无效链接只保留链接文本。
      }
    }
  }

  if (output instanceof HTMLElement && SAFE_TEXT_ALIGNMENTS.has(element.style.textAlign)) {
    output.style.textAlign = element.style.textAlign;
  }

  node.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, document);
    if (sanitized) output.appendChild(sanitized);
  });
  return output;
}

/** 将公告 HTML 限制为编辑器支持的安全结构。 */
export function sanitizeRichHtml(value: string | undefined): string {
  if (!value || typeof DOMParser === 'undefined') return '';

  const source = new DOMParser().parseFromString(value, 'text/html');
  const output = new DOMParser().parseFromString('', 'text/html');
  source.body.childNodes.forEach((node) => {
    const sanitized = sanitizeNode(node, output);
    if (sanitized) output.body.appendChild(sanitized);
  });
  return output.body.innerHTML;
}

/** 提取净化后 HTML 的可见文字，供发布校验使用。 */
export function getRichTextPlainText(value: string | undefined): string {
  if (!value) return '';
  if (typeof DOMParser === 'undefined') return value.replace(/<[^>]*>/g, '').trim();
  return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() ?? '';
}
