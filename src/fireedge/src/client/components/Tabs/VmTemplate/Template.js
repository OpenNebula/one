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
import { useContext } from 'react'
import { Accordion, AccordionDetails } from '@material-ui/core'

import { TabContext } from 'client/components/Tabs/TabProvider'

const TemplateTab = () => {
  const { data: template = {} } = useContext(TabContext)
  const { TEMPLATE } = template

  return (
    <Accordion expanded TransitionProps={{ unmountOnExit: true }}>
      <AccordionDetails>
        <pre>
          <code style={{ whiteSpace: 'break-spaces' }}>
            {JSON.stringify(TEMPLATE, null, 2)}
          </code>
        </pre>
      </AccordionDetails>
    </Accordion>
  )
}

TemplateTab.displayName = 'TemplateTab'

export default TemplateTab
