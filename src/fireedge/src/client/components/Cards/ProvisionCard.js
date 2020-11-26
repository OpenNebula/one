import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Avatar, IconButton } from '@material-ui/core'
import ProviderIcon from '@material-ui/icons/Public'
import ProvisionIcon from '@material-ui/icons/Cloud'

import SelectCard from 'client/components/Cards/SelectCard'
import { STATIC_FILES_URL } from 'client/constants'

const ProvisionCard = memo(
  ({ value, isSelected, handleClick, isProvider, imgAsAvatar, actions }) => {
    const DEFAULT_IMAGE = isProvider ? 'provider.png' : 'provision.jpg'
    const { ID, NAME, TEMPLATE: { PLAIN = '{}' } } = value
    // TODO: show error when fail parse
    const { image = DEFAULT_IMAGE } = JSON.parse(PLAIN) ?? {}

    const isExternalURL = RegExp(/^(http|https):/g).test(image)

    const onError = evt => {
      evt.target.src = `${STATIC_FILES_URL}/${DEFAULT_IMAGE}`
    }

    const renderAction = ({ handleClick, icon: Icon, iconProps, cy }) => (
      <IconButton key={cy} data-cy={cy} onClick={handleClick}>
        <Icon {...iconProps} />
      </IconButton>
    )

    return (
      <SelectCard
        title={`${ID} - ${NAME}`}
        isSelected={isSelected}
        handleClick={handleClick}
        action={actions?.map(action => renderAction(action))}
        icon={isProvider ? <ProviderIcon /> : <ProvisionIcon />}
        {...(imgAsAvatar
          ? {
            icon: <Avatar
              src={isExternalURL ? image : `${STATIC_FILES_URL}/${image}`}
              variant="rounded"
              style={{ width: 100, height: 80 }}
              imgProps={{ onError }}
            />
          }
          : { mediaProps: { component: 'img', image, onError } }
        )}
      />
    )
  }, (prev, next) => prev.isSelected === next.isSelected
)

ProvisionCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      PLAIN: PropTypes.string,
      PROVISION_BODY: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ])
    })
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  imgAsAvatar: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      iconProps: PropTypes.shape({
        color: PropTypes.oneOf([
          'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
        ])
      }),
      cy: PropTypes.string
    })
  )
}

ProvisionCard.defaultProps = {
  value: {},
  isSelected: undefined,
  handleClick: undefined,
  isProvider: false,
  imgAsAvatar: false,
  actions: undefined
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
