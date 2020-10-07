import React, { memo, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import { makeStyles, Box } from '@material-ui/core';
import { Add as AddIcon, SelectAll as SelectAllIcon } from '@material-ui/icons';
import ReactFlow, { Background } from 'react-flow-renderer';
import { useFormContext } from 'react-hook-form';

import SpeedDials from 'client/components/SpeedDials';
import { STEP_ID as TIER_ID } from 'client/containers/Application/Create/Steps/Tiers';

import CustomNode from './CustomNode';
import useFlowGraph from './useFlowGraph';

const NOT_KEY_CODE = -1;

const useStyles = makeStyles(() => ({
  root: {
    '& .react-flow__handle': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      '&-connecting': {
        backgroundColor: '#ff6060'
      },
      '&-valid': {
        backgroundColor: '#55dd99'
      }
    }
  }
}));

const Flow = memo(({ dataFields, handleCreate, handleEdit, handleSetData }) => {
  const { watch } = useFormContext();
  const classes = useStyles();
  const {
    flow,
    handleRefreshFlow,
    handleRemoveElements,
    handleConnect,
    handleUpdatePosition,
    handleSelectAll
  } = useFlowGraph({ nodeFields: dataFields, setList: handleSetData });

  useEffect(() => {
    handleRefreshFlow(watch(TIER_ID), ({ id }) => ({
      handleEdit: () => handleEdit(id)
    }));
  }, [watch]);

  const actions = useMemo(
    () => [
      {
        icon: <AddIcon />,
        name: 'Add',
        handleClick: handleCreate
      },
      {
        icon: <SelectAllIcon />,
        name: 'Select all',
        handleClick: handleSelectAll
      }
    ],
    [handleCreate, handleSelectAll]
  );

  return (
    <ReactFlow
      className={classes.root}
      elements={flow}
      nodeTypes={{ tier: CustomNode }}
      onConnect={handleConnect}
      onNodeDragStop={handleUpdatePosition}
      onElementsRemove={handleRemoveElements}
      selectionKeyCode={NOT_KEY_CODE}
    >
      <SpeedDials actions={actions} />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
});

Flow.propTypes = {
  dataFields: PropTypes.arrayOf(PropTypes.string),
  handleCreate: PropTypes.func,
  handleEdit: PropTypes.func,
  handleSetData: PropTypes.func
};

Flow.defaultProps = {
  dataFields: [],
  handleCreate: undefined,
  handleEdit: undefined,
  handleSetData: undefined
};

export default Flow;
