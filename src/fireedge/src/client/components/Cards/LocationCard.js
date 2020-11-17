import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { CardContent, Typography } from '@material-ui/core'
import ProvidersIcon from '@material-ui/icons/Public'

import SelectCard from './SelectCard'

const LocationCard = memo(
  ({ value, isSelected, handleClick }) => {
    const { key, properties } = value

    return (
      <SelectCard
        title={key}
        avatar={<ProvidersIcon />}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <CardContent>
          {properties && Object.entries(properties)
            ?.map(([pKey, pVal]) => (
              <Typography key={pKey} variant="body2">
                <b>{pKey}</b>{` - ${pVal}`}
              </Typography>
            ))}
        </CardContent>
      </SelectCard>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

LocationCard.propTypes = {
  value: PropTypes.shape({
    key: PropTypes.string.isRequired,
    properties: PropTypes.object
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

LocationCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined
}

LocationCard.displayName = 'LocationCard'

export default LocationCard
