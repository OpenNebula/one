import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { AccountTree as NetworkIcon } from '@material-ui/icons'
import SelectCard from 'client/components/Cards/SelectCard'

const NetworkCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME } = value

    return (
      <SelectCard
        stylesProps={{ minHeight: 120 }}
        icon={<NetworkIcon />}
        title={`${ID} - ${NAME}`}
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

NetworkCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string
    })
  )
}

NetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
