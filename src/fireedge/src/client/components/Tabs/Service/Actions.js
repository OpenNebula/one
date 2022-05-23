/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useGetServiceQuery } from 'client/features/OneApi/service'
// import ScheduleActionCard from 'client/components/Cards/ScheduleActionCard'

/**
 * Renders the list of schedule actions from a Service.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service id
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from user view yaml
 * @returns {ReactElement} Schedule actions tab
 */
const SchedulingTab = ({ id, tabProps: { actions } = {} }) => {
  const { data: service = {} } = useGetServiceQuery({ id })

  return (
    <>
      <Stack gap="1em" py="0.8em">
        {service?.NAME}
        {/* TODO: scheduler actions & form */}
      </Stack>
    </>
  )
}

SchedulingTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

export default SchedulingTab
