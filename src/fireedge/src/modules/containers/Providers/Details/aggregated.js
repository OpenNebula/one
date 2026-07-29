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

import {
  Button,
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, STYLE_BUTTONS, T } from '@ConstantsModule'
import { Provider } from '@ResourcesModule'
import { aggregateMetrics } from '@UtilsModule'
import { Box } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon } from 'iconoir-react'

const NUMBER_OF_PROVISIONS = 'TEMPLATE.PROVIDER_BODY.provision_ids.length'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {Array} root0.selectedProviders - Selected providers
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @returns {Component} - Aggregated providers details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedProviders = [],
  handleClose,
  handleSelect,
  handleDeselect,
}) => {
  const aggregatedMetrics = useMemo(
    () => aggregateMetrics(selectedProviders, [NUMBER_OF_PROVISIONS]),
    [selectedProviders]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedProviders?.length} ${T.Providers} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <LabelButton
                  selectedRows={selectedProviders}
                  resourceType={RESOURCE_NAMES.PROVIDER}
                  isDisabled={!selectedProviders.length}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [
                T.NumberProvisions,
                String(aggregatedMetrics?.[NUMBER_OF_PROVISIONS] ?? 0),
              ],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Provider.Tabs.Aggregated,
            resourceId: Provider.RID,
            tabProps: {
              selected: selectedProviders,
              handleSelect,
              handleDeselect,
            },
          },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedProviders: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
}
