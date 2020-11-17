import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Button, CardActions, Badge } from '@material-ui/core'
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows'

import { Tr } from 'client/components/HOC'
import SelectCard from './SelectCard'

const TierCard = memo(
  ({ value, handleEdit, handleRemove, cardProps }) => {
    const { name, cardinality } = value

    return (
      <SelectCard
        observerOff
        icon={
          <Badge
            badgeContent={cardinality}
            color="primary"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
          >
            <DesktopWindowsIcon />
          </Badge>
        }
        title={name}
        cardProps={cardProps}
      >
        <CardActions>
          {handleEdit && (
            <Button variant="contained" size="small" onClick={handleEdit} disableElevation>
              {Tr('Edit')}
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

TierCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string,
    cardinality: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ])
  }),
  handleEdit: PropTypes.func,
  handleRemove: PropTypes.func,
  cardProps: PropTypes.object
}

TierCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleRemove: undefined,
  cardProps: undefined
}

TierCard.displayName = 'TierCard'

export default TierCard
