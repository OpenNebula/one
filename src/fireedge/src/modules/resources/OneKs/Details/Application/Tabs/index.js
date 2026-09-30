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

import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { AlertNotification, Tabs } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { Info } from '@modules/resources/OneKs/Details/Application/Tabs/Info'
import { getStyles } from '@modules/resources/OneKs/Details/Application/Tabs/styles'

/**
 * @param {object} props - Tab props
 * @param {object} props.application - Installed application
 * @param {boolean} props.isError - Whether details failed to load
 * @returns {object} Installed application tabs
 */
export const ApplicationTabs = ({ application, isError }) => (
  <Box sx={(theme) => getStyles({ theme })}>
    {isError && (
      <AlertNotification
        type="primary"
        status="error"
        description={T.SomethingWrong}
        isDismissible={false}
      />
    )}
    <Tabs
      type="line"
      defaultSelect={0}
      options={[{ id: Info.id, title: Info.title }]}
    />
    <Box className="tab-content" data-cy="tab-content-info">
      <Info application={application} />
    </Box>
  </Box>
)

ApplicationTabs.displayName = 'ApplicationTabs'
ApplicationTabs.propTypes = {
  application: PropTypes.object,
  isError: PropTypes.bool,
}
