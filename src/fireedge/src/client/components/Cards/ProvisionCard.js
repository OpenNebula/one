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

import { Db as ProviderIcon, Cloud as ProvisionIcon } from 'iconoir-react'
import { Typography } from '@mui/material'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge } from 'client/components/Status'
import Image from 'client/components/Image'

import { isExternalURL } from 'client/utils'
import {
  PROVISIONS_STATES,
  PROVIDER_IMAGES_URL,
  PROVISION_IMAGES_URL,
  DEFAULT_IMAGE,
} from 'client/constants'

const ProvisionCard = memo(
  ({
    value,
    image: propImage,
    isSelected,
    handleClick,
    isProvider,
    actions,
    deleteAction,
    configureAction,
  }) => {
    const {
      ID,
      NAME,
      TEMPLATE: { BODY = {} },
    } = value

    const stateInfo = PROVISIONS_STATES[BODY.state]
    const image = propImage ?? BODY?.image

    const isExternalImage = useMemo(() => isExternalURL(image), [image])

    const imageUrl = useMemo(() => {
      if (!image) return DEFAULT_IMAGE

      const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL

      return isExternalImage ? image : `${IMAGES_URL}/${image}`
    }, [isExternalImage, isProvider, image])

    return (
      <SelectCard
        action={
          (actions?.length > 0 || deleteAction || configureAction) && (
            <>
              {actions?.map((action) => (
                <Action key={action?.cy} {...action} />
              ))}
              {configureAction && <ButtonToTriggerForm {...configureAction} />}
              {deleteAction && <ButtonToTriggerForm {...deleteAction} />}
            </>
          )
        }
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
              alt={`${isProvider ? 'provider' : 'provision'}-logo`}
              src={imageUrl}
              withSources={image && !isExternalImage}
            />
          ),
        }}
        subheader={`#${ID}`}
        title={
          <Typography
            component="span"
            sx={{
              cursor: 'pointer',
              '&:hover': {
                color: 'secondary.dark',
              },
            }}
            data-cy={`${isProvider ? 'provider' : 'provision'}-card-title`}
            onClick={handleClick}
          >
            {NAME}
          </Typography>
        }
        disableFilterImage={isExternalImage}
      />
    )
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.value?.TEMPLATE?.BODY?.state === next.value?.TEMPLATE?.BODY?.state
)

ProvisionCard.propTypes = {
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  image: PropTypes.string,
  deleteAction: PropTypes.object,
  configureAction: PropTypes.object,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      cy: PropTypes.string,
    })
  ),
}

ProvisionCard.defaultProps = {
  actions: undefined,
  handleClick: undefined,
  isProvider: false,
  isSelected: undefined,
  image: undefined,
  deleteAction: undefined,
  confifureAction: undefined,
  value: {},
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
