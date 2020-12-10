import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Button, CardActions } from '@material-ui/core'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const ApplicationNetworkCard = memo(({
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
            {Tr(T.Edit)}
          </Button>
        )}
        {handleClone && (
          <Button
            variant="contained"
            size="small"
            onClick={handleClone}
            disableElevation
          >
            {Tr(T.Clone)}
          </Button>
        )}
        {handleRemove && (
          <Button size="small" onClick={handleRemove} disableElevation>
            {Tr(T.Remove)}
          </Button>
        )}
      </CardActions>
    </SelectCard>
  )
}
)

ApplicationNetworkCard.propTypes = {
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

ApplicationNetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined
}

ApplicationNetworkCard.displayName = 'ApplicationNetworkCard'

export default ApplicationNetworkCard
