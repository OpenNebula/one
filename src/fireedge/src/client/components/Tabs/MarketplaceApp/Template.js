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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext, useMemo } from 'react'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { NavArrowDown as ExpandMoreIcon } from 'iconoir-react'

import { TabContext } from 'client/components/Tabs/TabProvider'
import { decodeBase64 } from 'client/utils'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const AppTemplateTab = () => {
  const { data: marketplaceApp = {} } = useContext(TabContext)
  const {
    TEMPLATE: { APPTEMPLATE64, VMTEMPLATE64 },
  } = marketplaceApp

  const appTemplate = useMemo(
    () => decodeBase64(APPTEMPLATE64),
    [APPTEMPLATE64]
  )
  const vmTemplate = useMemo(() => decodeBase64(VMTEMPLATE64), [VMTEMPLATE64])

  return (
    <>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Translate word={T.AppTemplate} />
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code
              style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}
            >
              {appTemplate}
            </code>
          </pre>
        </AccordionDetails>
      </Accordion>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Translate word={T.VMTemplate} />
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code
              style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}
            >
              {vmTemplate}
            </code>
          </pre>
        </AccordionDetails>
      </Accordion>
    </>
  )
}

AppTemplateTab.displayName = 'AppTemplateTab'

export default AppTemplateTab
