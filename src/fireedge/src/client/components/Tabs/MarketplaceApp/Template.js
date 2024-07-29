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
import { useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { NavArrowDown as ExpandMoreIcon } from 'iconoir-react'

import { useGetMarketplaceAppQuery } from 'client/features/OneApi/marketplaceApp'
import { decodeBase64 } from 'client/utils'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders App template tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Marketplace App id
 * @returns {ReactElement} App Template tab
 */
const AppTemplateTab = ({ id }) => {
  const { data: marketplaceApp = {} } = useGetMarketplaceAppQuery({ id })
  const { APPTEMPLATE64, VMTEMPLATE64 } = marketplaceApp?.TEMPLATE

  const appTemplate = useMemo(
    () => (APPTEMPLATE64 ? decodeBase64(APPTEMPLATE64) : T.Empty),
    [APPTEMPLATE64]
  )

  const vmTemplate = useMemo(
    () => (VMTEMPLATE64 ? decodeBase64(VMTEMPLATE64) : T.Empty),
    [VMTEMPLATE64]
  )

  return (
    <>
      <Accordion variant="outlined">
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
      <Accordion>
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

AppTemplateTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

AppTemplateTab.displayName = 'AppTemplateTab'

export default AppTemplateTab
