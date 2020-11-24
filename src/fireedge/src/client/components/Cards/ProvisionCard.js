import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { CardActions, IconButton } from '@material-ui/core'
import ProvisionIcon from '@material-ui/icons/Cloud'
import InfoIcon from '@material-ui/icons/Info'
import EditIcon from '@material-ui/icons/Build'
import DeleteIcon from '@material-ui/icons/Delete'

import SelectCard from 'client/components/Cards/SelectCard'

const ProvisionCard = memo(
  ({ value, handleShow, handleEdit, handleDelete }) => {
    const { ID, NAME } = value

    const renderAction = ({ handleClick, icon: Icon, iconColor }) =>
      handleClick && (
        <IconButton onClick={handleClick} size="small">
          <Icon color={iconColor} style={{ margin: 8 }} />
        </IconButton>
      )

    return (
      <SelectCard title={`${ID} - ${NAME}`} icon={<ProvisionIcon />}>
        <CardActions>
          {renderAction({
            handleClick: handleShow,
            icon: InfoIcon,
            iconColor: 'primary'
          })}
          {renderAction({ handleClick: handleEdit, icon: EditIcon })}
          {renderAction({ handleClick: handleDelete, icon: DeleteIcon })}
        </CardActions>
      </SelectCard>
    )
  }
)

ProvisionCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired
  }),
  handleShow: PropTypes.func,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func
}

ProvisionCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleEdit: undefined,
  handleDelete: undefined
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
