import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { CardActions, IconButton } from '@material-ui/core'
import TemplateIcon from '@material-ui/icons/Description'
import InfoIcon from '@material-ui/icons/Info'
import EditIcon from '@material-ui/icons/Build'
import DeleteIcon from '@material-ui/icons/Delete'

import SelectCard from './SelectCard'

const ProviderCard = memo(
  ({ value, handleShow, handleEdit, handleDelete }) => {
    const { ID, NAME } = value

    return (
      <SelectCard title={`${ID} - ${NAME}`} icon={<TemplateIcon />}>
        <CardActions>
          {handleShow && (
            <IconButton onClick={handleShow} size="small">
              <InfoIcon color="primary" style={{ margin: 8 }} />
            </IconButton>
          )}
          {handleEdit && (
            <IconButton onClick={handleEdit} size="small">
              <EditIcon style={{ margin: 8 }} />
            </IconButton>
          )}
          {handleDelete && (
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon style={{ margin: 8 }} />
            </IconButton>
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
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func
}

ProviderCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleEdit: undefined,
  handleDelete: undefined
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
