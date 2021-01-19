import * as React from 'react'
import PropTypes from 'prop-types'

import ProvidersIcon from '@material-ui/icons/Public'
import SelectCard from 'client/components/Cards/SelectCard'

import { isExternalURL } from 'client/utils'
import {
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE
} from 'client/constants'

const ProvisionTemplateCard = React.memo(
  ({ value, isProvider, isSelected, handleClick }) => {
    const { description, name, plain = {} } = value
    const { image } = isProvider ? plain : value
    const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL

    const onError = evt => {
      evt.target.src = evt.target.src === DEFAULT_IMAGE ? DEFAULT_IMAGE : ''
    }

    const imgSource = React.useMemo(() =>
      isExternalURL(image) ? image : `${IMAGES_URL}/${image}`
    , [image])

    return (
      <SelectCard
        title={name}
        subheader={description}
        icon={<ProvidersIcon />}
        isSelected={isSelected}
        handleClick={handleClick}
        mediaProps={image && {
          component: 'img',
          image: imgSource,
          draggable: false,
          onError
        }}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

ProvisionTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    plain: PropTypes.shape({
      image: PropTypes.string
    })
  }),
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

ProvisionTemplateCard.defaultProps = {
  value: { name: '', description: '' },
  isProvider: undefined,
  isSelected: false,
  handleClick: undefined
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
