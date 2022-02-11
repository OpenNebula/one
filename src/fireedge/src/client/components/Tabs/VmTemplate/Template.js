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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Accordion, AccordionDetails } from '@mui/material'

import { useGetTemplateQuery } from 'client/features/OneApi/vmTemplate'

/**
 * Renders template tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Template id
 * @returns {ReactElement} Template tab
 */
const TemplateTab = ({ id }) => {
  const { data: template = {} } = useGetTemplateQuery({ id })
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

TemplateTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

TemplateTab.displayName = 'TemplateTab'

export default TemplateTab
