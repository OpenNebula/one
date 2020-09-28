import dagre from 'dagre';

const generateFlow = (elements = []) => {
  const NODE_WIDTH = 400;
  const NODE_HEIGHT = 200;
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({});
  graph.setDefaultEdgeLabel(() => ({}));

  elements.forEach(({ id, type, data, parents = [] }) => {
    graph.setNode(id, {
      data,
      type: type ?? 'default',
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    });
    parents.forEach(parent => {
      graph.setEdge(parent, id);
    });
  });

  dagre.layout(graph);

  const nodes = graph.nodes().map(id => {
    const node = graph.node(id);
    return {
      id,
      type: node?.type,
      data: node?.data,
      position: {
        x: node.x - node.width / 2,
        y: node.y - node.height / 2
      }
    };
  });

  const edges = graph.edges().map(({ v: source, w: target }) => ({
    id: `__${source}__${target}`,
    source,
    target,
    animated: true
  }));

  return [...nodes, ...edges];
};

export { generateFlow };
