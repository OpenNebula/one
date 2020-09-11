import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Fab, Box, Card } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

import ReactFlow, {
  removeElements,
  addEdge,
  MiniMap,
  Background,
  isNode
} from 'react-flow-renderer';

const initialElements = [];

const onNodeDragStart = (event, node) => console.log('drag start', node);
const onNodeDragStop = (event, node) => console.log('drag stop', node);
const onSelectionDrag = (event, nodes) => console.log('selection drag', nodes);
const onSelectionDragStart = (event, nodes) =>
  console.log('selection drag start', nodes);
const onSelectionDragStop = (event, nodes) =>
  console.log('selection drag stop', nodes);
const onElementClick = (event, element) =>
  console.log(`${isNode(element) ? 'node' : 'edge'} click:`, element);
const onSelectionChange = elements => console.log('selection change', elements);
const onLoad = reactFlowInstance => {
  console.log('flow loaded:', reactFlowInstance);
  reactFlowInstance.fitView();
};

const onMoveEnd = transform => console.log('zoom/move end', transform);

const connectionLineStyle = { stroke: '#ddd' };
const snapGrid = [16, 16];

const CustomNode = React.memo(({ data }) => (
  <Card style={{ height: 100 }}>
    <div>Custom node</div>
  </Card>
));

const FlowWithFAB = ({ handleClick }) => {
  const [elements, setElements] = useState(initialElements);
  const onElementsRemove = elementsToRemove =>
    setElements(els => removeElements(elementsToRemove, els));
  const onConnect = params => setElements(els => addEdge(params, els));

  return (
    <Box flexGrow={1} height={1}>
      <ReactFlow
        elements={elements}
        onElementClick={onElementClick}
        onElementsRemove={onElementsRemove}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStart={onSelectionDragStart}
        onSelectionDrag={onSelectionDrag}
        onSelectionDragStop={onSelectionDragStop}
        onSelectionChange={onSelectionChange}
        onMoveEnd={onMoveEnd}
        onLoad={onLoad}
        connectionLineStyle={connectionLineStyle}
        snapToGrid
        snapGrid={snapGrid}
        nodeTypes={{ custom: CustomNode }}
      >
        <MiniMap
          nodeColor={n => {
            if (n.style?.background) return n.style.background;
            if (n.type === 'input') return '#9999ff';
            if (n.type === 'output') return '#79c9b7';
            if (n.type === 'default') return '#ff6060';

            return '#eee';
          }}
        />
        <Fab
          color="primary"
          aria-label="add-role"
          onClick={handleClick}
          style={{ top: 10, left: 10, zIndex: 5 }}
        >
          <AddIcon />
        </Fab>
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </Box>
  );
};

FlowWithFAB.propTypes = {
  handleClick: PropTypes.func
};

FlowWithFAB.defaultProps = {
  handleClick: evt => evt
};

export default FlowWithFAB;
