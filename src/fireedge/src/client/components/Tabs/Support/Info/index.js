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
import { ReactElement, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import Information from 'client/components/Tabs/Support/Info/InformationPanel'

import { useGetTicketMutation } from 'client/features/OneApi/support'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Support ticket ID
 * @returns {ReactElement} Information tab
 */
const SupportTicketInfoTab = ({ tabProps = {}, id }) => {
  const { information_panel: informationPanel } = tabProps
  const [getTicket, { data = undefined }] = useGetTicketMutation()

  useEffect(() => getTicket(id).unwrap(), [id])

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && <Information ticket={data} />}
    </Stack>
  )
}

SupportTicketInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

SupportTicketInfoTab.displayName = 'SupportTicketInfoTab'

export default SupportTicketInfoTab
