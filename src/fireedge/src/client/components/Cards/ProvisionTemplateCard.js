/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import {
  Db as ProviderIcon,
  SettingsCloud as ProvisionIcon,
} from 'iconoir-react'

import { SelectCard } from 'client/components/Cards'
import Image from 'client/components/Image'
import { isExternalURL } from 'client/utils'
import {
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE,
} from 'client/constants'

const ProvisionTemplateCard = memo(
  ({ value, image, isProvider, isSelected, isValid, handleClick }) => {
    const { description, name } = value

    const isExternalImage = useMemo(() => isExternalURL(image), [image])

    const imageUrl = useMemo(() => {
      if (!image) return DEFAULT_IMAGE

      const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL

      return isExternalImage ? image : `${IMAGES_URL}/${image}`
    }, [isExternalImage, isProvider, image])

    return (
      <SelectCard
        dataCy={isProvider ? 'provider' : 'provision'}
        disableFilterImage={isExternalImage}
        handleClick={handleClick}
        icon={isProvider ? <ProviderIcon /> : <ProvisionIcon />}
        cardActionAreaProps={{ disabled: !isValid }}
        isSelected={isSelected}
        mediaProps={{
          component: 'div',
          children: (
            <Image
              alt="provision-logo"
              src={imageUrl}
              withSources={image && !isExternalImage}
            />
          ),
        }}
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
  image: PropTypes.string,
  value: PropTypes.object,
}

ProvisionTemplateCard.defaultProps = {
  handleClick: undefined,
  isProvider: undefined,
  isSelected: false,
  isValid: true,
  image: undefined,
  value: { name: '', description: '' },
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
