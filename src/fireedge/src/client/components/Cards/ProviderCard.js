import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Button, CardActions } from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

import { Tr } from 'client/components/HOC'
import SelectCard from './SelectCard'

const ProviderCard = memo(
  ({ value, handleShow, handleRemove }) => {
    const { ID, NAME } = value

    return (
      <SelectCard title={`${ID} - ${NAME}`} icon={<FileIcon />}>
        <CardActions>
          {handleShow && (
            <Button
              variant="contained"
              size="small"
              onClick={handleShow}
              disableElevation
            >
              {Tr('Info')}
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

ProviderCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired
  }),
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func
}

ProviderCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleRemove: undefined
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
