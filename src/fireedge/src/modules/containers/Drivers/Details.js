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
  DetailsDrawer,
  getLabelMenuButtonProps,
  InfoSlot,
  TabSlot,
  ToggleGroup,
} from '@ComponentsModule'
import { LOGO_DRIVERS_IMAGES_URL, RESOURCE_NAMES } from '@ConstantsModule'
import { DriverAPI } from '@FeaturesModule'
import { getLabelTags } from '@ModelsModule'
import { Single as DRIVER_TABS } from '@modules/containers/Drivers/Tabs'
import { Cancel, RefreshDouble } from 'iconoir-react'
import PropTypes from 'prop-types'

/**
 * Resolves the configured driver logo.
 *
 * @param {object} driver - Driver data
 * @param {object} driver.fireedge - Driver UI configuration
 * @returns {string} Driver logo URL
 */
const getLogo = ({ fireedge = {} } = {}) => {
  const logo = fireedge?.logo
  if (!logo) return `${LOGO_DRIVERS_IMAGES_URL}/default.png`
  if (logo.includes(LOGO_DRIVERS_IMAGES_URL)) return logo

  return `${LOGO_DRIVERS_IMAGES_URL}/${logo}`
}

/**
 * Displays details for a selected driver.
 *
 * @param {object} root0 - Component props
 * @param {object} root0.selectedDriver - Selected driver
 * @param {Function} root0.handleClose - Close handler
 * @returns {object} Driver details drawer
 */
export const DriverDetails = ({ selectedDriver, handleClose }) => {
  const name = selectedDriver?.name
  const {
    data: detailedDriver,
    isFetching,
    refetch,
  } = DriverAPI.useGetDriverQuery(
    { name: name?.toLowerCase() },
    { skip: !name, refetchOnMountOrArgChange: 10 }
  )
  const driver =
    detailedDriver?.name === name?.toLowerCase()
      ? detailedDriver
      : selectedDriver

  return (
    <DetailsDrawer
      isOpen={!!selectedDriver}
      isLoading={isFetching && !detailedDriver}
      onClose={handleClose}
      slots={[
        [
          InfoSlot,
          {
            icon: getLogo(driver),
            title: driver?.name,
            tags: getLabelTags(driver?.LABELS),
            labels: [],
            /** @returns {object} Driver details toolbar */
            Toolbar: () => (
              <ToggleGroup
                size="medium"
                options={[
                  [
                    {
                      ...getLabelMenuButtonProps({
                        selectedRows: [driver],
                        resourceType: RESOURCE_NAMES.DRIVER,
                        isDisabled: isFetching,
                      }),
                    },
                    {
                      startIcon: <RefreshDouble width="16px" height="16px" />,
                      value: 'refresh',
                      onClick: refetch,
                      isDisabled: isFetching,
                    },
                    {
                      startIcon: <Cancel width="16px" height="16px" />,
                      value: 'close',
                      onClick: handleClose,
                    },
                  ],
                ]}
              />
            ),
          },
        ],
        [
          TabSlot,
          {
            tabs: DRIVER_TABS,
            resourceId: RESOURCE_NAMES.DRIVER,
            tabProps: { selected: driver },
          },
        ],
      ]}
    />
  )
}

DriverDetails.propTypes = {
  selectedDriver: PropTypes.object,
  handleClose: PropTypes.func,
}
