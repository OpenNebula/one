/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Db as ProviderIcon, Cloud as ProvisionIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge } from 'client/components/Status'
import Image from 'client/components/Image'

import { isExternalURL } from 'client/utils'
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
          children: (
            <Image
              src={imageUrl}
              withSources={image && !isExternalImage}
            />
          )
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
  value: PropTypes.object,
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
