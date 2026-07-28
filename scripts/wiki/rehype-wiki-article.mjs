const scrollableNames = {
  pre: 'Scrollable code block',
  table: 'Scrollable data table',
};

function visit(node) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (node.type === 'element' && scrollableNames[node.tagName]) {
    node.properties ||= {};
    node.properties.tabIndex = 0;
    node.properties.ariaLabel ||= scrollableNames[node.tagName];
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child);
    }
  }
}

export function rehypeWikiArticle() {
  return (tree) => {
    visit(tree);
  };
}
