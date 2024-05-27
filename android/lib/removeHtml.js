import he from 'he';

export function removeHtml(source) {
  const substr = source ? he.decode(
    source.replace(/<\/p>/gi, '\n').
    replace(/<br\/>/gi, '\n').
    replace(/<br>/gi, '\n').
    replace(/(<([^>]+)>)/gi, '')) : '';
  return substr.endsWith('\n') ? substr.slice(0, -1) : substr;
}
