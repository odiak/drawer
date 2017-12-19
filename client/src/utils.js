export function getOffset(node) {
  let left = 0, top = 0;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return {left, top};
}
