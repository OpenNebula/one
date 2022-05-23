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
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders configuration tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Configuration tab
 */
const VmConfigurationTab = ({ id }) => {
  const { data: vm = {} } = useGetVmQuery({ id })
  const { TEMPLATE, USER_TEMPLATE } = vm

  return (
    <div>
      <Accordion variant="outlined">
        <AccordionSummary>
          <Translate word={T.UserTemplate} />
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code style={{ whiteSpace: 'break-spaces' }}>
              {JSON.stringify(USER_TEMPLATE, null, 2)}
            </code>
          </pre>
        </AccordionDetails>
      </Accordion>
      <Accordion variant="outlined">
        <AccordionSummary>
          <Translate word={T.Template} />
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code style={{ whiteSpace: 'break-spaces' }}>
              {JSON.stringify(TEMPLATE, null, 2)}
            </code>
          </pre>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

VmConfigurationTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmConfigurationTab.displayName = 'VmConfigurationTab'

export default VmConfigurationTab
