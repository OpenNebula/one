import React, { memo, useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import ProviderIcon from '@material-ui/icons/Public'
import ProvisionIcon from '@material-ui/icons/Cloud'

import SelectCard from 'client/components/Cards/SelectCard'
import Action from 'client/components/Cards/SelectCard/Action'
import { StatusBadge } from 'client/components/Status'
import { isExternalURL } from 'client/utils'
import {
  PROVISIONS_STATES,
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE
} from 'client/constants'

const ProvisionCard = memo(
  ({ value, isSelected, handleClick, isProvider, actions }) => {
    const [{ image, ...body }, setBody] = useState({})

    const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL
    const { ID, NAME, TEMPLATE: { PLAIN = {}, BODY = {} } } = value
    const stateInfo = PROVISIONS_STATES[body?.state]

    useEffect(() => {
      const json = isProvider ? PLAIN : BODY
      setBody({ ...json, image: json.image ?? DEFAULT_IMAGE })
    }, [])

    const onError = evt => {
      evt.target.src = evt.target.src === DEFAULT_IMAGE ? DEFAULT_IMAGE : ''
    }

    const imgSource = useMemo(() => (
      isExternalURL(image) ? image : `${IMAGES_URL}/${image}`
    ), [image])

    return (
      <SelectCard
        title={NAME}
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
        action={actions?.map(action =>
          <Action key={action?.cy} {...action} />
        )}
        icon={
          isProvider ? (
            <ProviderIcon />
          ) : (
            <StatusBadge title={stateInfo?.name} stateColor={stateInfo?.color}>
              <ProvisionIcon />
            </StatusBadge>
          )
        }
        mediaProps={{
          component: 'img',
          image: imgSource,
          draggable: false,
          onError
        }}
      />
    )
  }, (prev, next) => (
    prev.isSelected === next.isSelected &&
    !prev.isProvider &&
    !next.isProvider &&
    prev.value?.BODY?.state === next.value?.BODY?.state
  )
)

ProvisionCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      PLAIN: PropTypes.object,
      BODY: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ])
    })
  }),
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
  value: {},
  isSelected: undefined,
  handleClick: undefined,
  isProvider: false,
  actions: undefined
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
