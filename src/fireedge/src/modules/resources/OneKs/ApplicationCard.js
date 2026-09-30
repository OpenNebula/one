/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'

import {
  CardBlock,
  MetadataSlot,
  TitleSlot,
  LabelSlot,
} from '@ComponentsModule'
import { getApplicationImage, getApplicationState } from '@ModelsModule'
import { ApplicationImagePlaceholder } from '@modules/resources/OneKs/ApplicationImagePlaceholder'

/**
 * Card representation of a OneKS catalogue application.
 *
 * @param {object} root0 - Params
 * @param {object} root0.application - Catalogue application
 * @param {boolean} root0.isSelected - Whether the card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} Application card
 */
export const OneKsApplicationCard = forwardRef(
  ({ application = {}, isSelected, onCheck, onClick }, ref) => {
    const { id, version, installable } = application
    const name = application?.name ?? application?.metadata?.name
    const { color: stateColor, name: stateName } = getApplicationState({
      installable: !!installable,
    })

    const tags = []
      .concat(
        application?.tag ??
          application?.metadata?.tag ??
          application?.tags ??
          application?.metadata?.tags
      )
      ?.flat()
      .map((tag) => [null, tag])
      .concat([[null, version]])
      .filter(([, value]) => Boolean(value))

    return (
      <CardBlock
        ref={ref}
        dataCy={`oneks-application-${id}`}
        icon={getApplicationImage(application)}
        iconFallback={<ApplicationImagePlaceholder />}
        iconSize={32}
        iconAspectRatio="1/1"
        isRemoveCheckbox
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [TitleSlot, { title: name ?? id }],
          !!tags.length && [MetadataSlot, { labels: tags }],
          [LabelSlot, { labels: [[stateName, stateColor]] }],
        ].filter(Boolean)}
        sx={{
          '& .card-details': {
            flexDirection: 'column',
            alignItems: 'center',
          },
          '& .card-slots': {
            alignItems: 'center',
            textAlign: 'center',
          },
          '& .card-slot': { width: '100%' },
          '& .card-slot > div': { justifyContent: 'center' },
        }}
      />
    )
  }
)

OneKsApplicationCard.propTypes = {
  application: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

OneKsApplicationCard.displayName = 'OneKsApplicationCard'
