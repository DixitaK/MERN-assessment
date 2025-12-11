import { Types } from 'mongoose';
export function buildTree(items: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  items.forEach(item => {
    const id = item._id.toString();
    map.set(id, { ...item.toObject ? item.toObject() : item, children: [] });
  });

  for (const [id, node] of map) {
    if (node.parent) {
      const parentId = node.parent.toString();
      const parentNode = map.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // parent not in dataset, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }
  return roots;
}
