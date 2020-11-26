import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Avatar } from '@material-ui/core'
import SelectCard from 'client/components/Cards/SelectCard'
import { STATIC_FILES_URL } from 'client/constants'

const ProvisionTemplateCard = memo(
  ({ value, isProvider, isSelected, handleClick }) => {
    const DEFAULT_IMAGE = isProvider ? 'provider.png' : 'provision.jpg'
    const { name, plain: { image = DEFAULT_IMAGE } = {} } = value

    const isExternalURL = RegExp(/^(http|https):/g).test(image)

    const onError = evt => {
      evt.target.src = `${STATIC_FILES_URL}/${DEFAULT_IMAGE}`
    }

    return (
      <SelectCard
        stylesProps={{ minHeight: 80 }}
        title={name}
        isSelected={isSelected}
        handleClick={handleClick}
        icon={
          <Avatar
            src={isExternalURL ? image : `${STATIC_FILES_URL}/${image}`}
            variant="rounded"
            style={{ width: 100, height: 80 }}
            imgProps={{ onError }}
          />
        }
      />
    )
  }, (prev, next) => prev.isSelected === next.isSelected
)

ProvisionTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
    plain: PropTypes.shape({
      image: PropTypes.string
    })
  }),
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

ProvisionTemplateCard.defaultProps = {
  value: {},
  isProvider: undefined,
  isSelected: undefined,
  handleClick: undefined
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
