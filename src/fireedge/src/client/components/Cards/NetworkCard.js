import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Button, CardActions } from '@material-ui/core'

import { Tr } from 'client/components/HOC'
import SelectCard from 'client/components/Cards/SelectCard'

const NetworkCard = memo(({
  value,
  isSelected,
  handleClick,
  handleEdit,
  handleClone,
  handleRemove
}) => {
  const { mandatory, name, description } = value

  return (
    <SelectCard
      icon={mandatory ? 'M' : undefined}
      title={name}
      subheader={description}
      isSelected={isSelected}
      handleClick={handleClick}
    >
      <CardActions>
        {handleEdit && (
          <Button
            variant="contained"
            size="small"
            onClick={handleEdit}
            disableElevation
          >
            {Tr('Edit')}
          </Button>
        )}
        {handleClone && (
          <Button
            variant="contained"
            size="small"
            onClick={handleClone}
            disableElevation
          >
            {Tr('Clone')}
          </Button>
        )}
        {handleRemove && (
          <Button size="small" onClick={handleRemove} disableElevation>
            {Tr('Remove')}
          </Button>
        )}
      </CardActions>
    </SelectCard>
  )
}
)

NetworkCard.propTypes = {
  value: PropTypes.shape({
    mandatory: PropTypes.bool,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string,
    id: PropTypes.string,
    extra: PropTypes.string
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  handleEdit: PropTypes.func,
  handleClone: PropTypes.func,
  handleRemove: PropTypes.func
}

NetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
