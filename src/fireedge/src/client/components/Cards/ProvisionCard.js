import React, { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Db as ProviderIcon, Cloud as ProvisionIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge } from 'client/components/Status'
import Image from 'client/components/Image'
import { isExternalURL } from 'client/utils'
import * as Types from 'client/types/provision'
import {
  PROVISIONS_STATES,
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE
} from 'client/constants'

const ProvisionCard = memo(
  ({ value, isSelected, handleClick, isProvider, actions }) => {
    const { ID, NAME, TEMPLATE: { PLAIN = {}, BODY = {} } } = value

    const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL
    const bodyData = isProvider ? PLAIN : BODY

    const stateInfo = PROVISIONS_STATES[bodyData?.state]
    const image = bodyData?.image ?? DEFAULT_IMAGE

    const isExternalImage = useMemo(() => isExternalURL(image), [image])

    const imageUrl = useMemo(
      () => isExternalImage ? image : `${IMAGES_URL}/${image}`,
      [isExternalImage]
    )

    return (
      <SelectCard
        action={actions?.map(action =>
          <Action key={action?.cy} {...action} />
        )}
        dataCy={isProvider ? 'provider' : 'provision'}
        handleClick={handleClick}
        icon={
          isProvider ? (
            <ProviderIcon />
          ) : (
            <StatusBadge title={stateInfo?.name} stateColor={stateInfo?.color}>
              <ProvisionIcon />
            </StatusBadge>
          )
        }
        isSelected={isSelected}
        mediaProps={{
          component: 'div',
          children: <Image src={imageUrl} withSources={image && !isExternalImage} />
        }}
        subheader={`#${ID}`}
        title={NAME}
        disableFilterImage={isExternalImage}
      />
    )
  }, (prev, next) => (
    prev.isSelected === next.isSelected &&
    prev.value?.TEMPLATE?.BODY?.state === next.value?.TEMPLATE?.BODY?.state
  )
)

ProvisionCard.propTypes = {
  value: PropTypes.oneOfType([
    Types.Provider,
    Types.Provision
  ]),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      cy: PropTypes.string
    })
  )
}

ProvisionCard.defaultProps = {
  actions: undefined,
  handleClick: undefined,
  isProvider: false,
  isSelected: undefined,
  value: {}
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
