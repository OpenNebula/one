import * as React from 'react'
import PropTypes from 'prop-types'

import * as Types from 'client/types/provision'

import ProvidersIcon from '@material-ui/icons/Public'
import SelectCard from 'client/components/Cards/SelectCard'

import { isExternalURL } from 'client/utils'
import {
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE,
  IMAGE_FORMATS
} from 'client/constants'

const ProvisionTemplateCard = React.memo(
  ({ value, isProvider, isSelected, isValid, handleClick }) => {
    const { description, name, plain = {} } = value
    const { image = '' } = isProvider ? plain : value

    const isExternalImage = isExternalURL(image)

    const mediaProps = React.useMemo(() => {
      const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL
      const src = isExternalImage ? image : `${IMAGES_URL}/${image}`
      const onError = evt => { evt.target.src = DEFAULT_IMAGE }

      return {
        component: 'picture',
        children: (
          <>
            {(image && !isExternalImage) && IMAGE_FORMATS.map(format => (
              <source
                key={format}
                srcSet={`${IMAGES_URL}/${image}.${format}`}
                type={`image/${format}`}
              />
            ))}
            <img
              decoding='async'
              draggable={false}
              loading='lazy'
              src={src}
              onError={onError}
            />
          </>
        )
      }
    }, [image, isProvider])

    return (
      <SelectCard
        dataCy={isProvider ? 'provider' : 'provision'}
        disableFilterImage={isExternalImage}
        handleClick={handleClick}
        icon={<ProvidersIcon />}
        cardActionAreaProps={{ disabled: !isValid }}
        isSelected={isSelected}
        mediaProps={mediaProps}
        subheader={description}
        title={name}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

ProvisionTemplateCard.propTypes = {
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  isValid: PropTypes.bool,
  value: PropTypes.oneOfType([
    Types.ProviderTemplate,
    Types.ProvisionTemplate
  ])
}

ProvisionTemplateCard.defaultProps = {
  handleClick: undefined,
  isProvider: undefined,
  isSelected: false,
  isValid: true,
  value: { name: '', description: '' }
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
