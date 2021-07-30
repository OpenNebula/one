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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'

import { TabContext } from 'client/components/Tabs/TabProvider'

const NavArrowDown = <span style={{ writingMode: 'vertical-rl' }}>{'>'}</span>

const VmConfigurationTab = () => {
  const { data: vm = {} } = React.useContext(TabContext)
  const { TEMPLATE, USER_TEMPLATE } = vm

  return (
    <div>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={NavArrowDown}>
          {'User Template'}
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code style={{ whiteSpace: 'break-spaces' }}>
              {JSON.stringify(USER_TEMPLATE, null, 2)}
            </code>
          </pre>
        </AccordionDetails>
      </Accordion>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={NavArrowDown}>
          {'Template'}
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

VmConfigurationTab.displayName = 'VmConfigurationTab'

export default VmConfigurationTab
