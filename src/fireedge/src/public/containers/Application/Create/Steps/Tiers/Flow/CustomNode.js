import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { Handle } from 'react-flow-renderer';

import { TierCard } from 'client/components/Cards';

const CustomNode = memo(({ data }) => {
  const { tier, handleEdit } = data;

  const isValidConnection = ({ target }) => !tier?.parents?.includes(target);

  return (
    <>
      <TierCard
        values={tier}
        handleEdit={handleEdit}
        cardProps={{
          style: { minWidth: 200 }
        }}
      />
      <Handle
        type="source"
        position="bottom"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        isValidConnection={isValidConnection}
      />
      <Handle
        type="target"
        position="top"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        isValidConnection={isValidConnection}
      />
    </>
  );
});

CustomNode.propTypes = {
  data: PropTypes.objectOf(PropTypes.any)
};

CustomNode.defaultProps = {
  data: {}
};

export default CustomNode;
