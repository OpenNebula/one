import * as React from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'

const NavArrowDown = <span style={{ writingMode: 'vertical-rl' }}>{'>'}</span>

const VmConfigurationTab = data => {
  const { TEMPLATE, USER_TEMPLATE } = data

  return (
    <div>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={NavArrowDown}>
          {'User Template'}
        </AccordionSummary>
        <AccordionDetails>
          <pre>
            <code>
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
            <code>
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
