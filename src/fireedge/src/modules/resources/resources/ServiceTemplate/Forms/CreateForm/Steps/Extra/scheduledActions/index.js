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
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Calendar as ActionIcon } from 'iconoir-react'

import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'

import { VM_SCHED_FIELDS } from '@modules/resources/resources/VirtualMachine/Forms/CreateSchedActionForm/schema'

import { Stack } from '@mui/material'
import { T } from '@ConstantsModule'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'

export const TAB_ID = 'sched_actions'

const Content = () => {
  const { watch } = useFormContext()

  const wSchedActions = watch(`${EXTRA_ID}.${TAB_ID}`)

  const {
    fields: schedActions,
    remove,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const handleAppend = () => {
    append({
      ACTION: '',
      PERIODIC: '',
      TIME: '',
    })
  }

  const {
    selectedIndex: selectedSchedAction,
    setSelectedIndex: setSelectedSchedAction,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: schedActions,
    onAdd: handleAppend,
    onRemove: remove,
  })

  return (
    <SelectableCardPanel
      items={schedActions}
      selectedIndex={selectedSchedAction}
      onSelect={setSelectedSchedAction}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={T.AddScheduleAction}
      addButtonCy="extra-add-userinput"
      getItemKey={(schedAction, idx) =>
        `${idx}-${schedAction?.id}-${schedAction?.name}`
      }
      cardIcon={ActionIcon}
      renderCardTitle={(_, idx) => `${T.ScheduleAction}#${idx}`}
      renderCardSubtitle={(_, idx) =>
        watch(`${EXTRA_ID}.${TAB_ID}.${idx}.ACTION`) || `${T.No} ${T.Type}`
      }
    >
      {selectedSchedAction != null && wSchedActions?.length > 0 && (
        <CollapsiblePanel
          title={T.ScheduleAction}
          isDefaultCollapsed={false}
          key={`inputs-${selectedSchedAction}`}
        >
          <Stack
            direction="column"
            alignItems="flex-start"
            gap="0.5rem"
            component="form"
            width="100%"
          >
            <FormWithSchema
              cy={`${TAB_ID}`}
              id={`${EXTRA_ID}.${TAB_ID}.${selectedSchedAction}`}
              fields={VM_SCHED_FIELDS({ vm: {} })}
            />
          </Stack>
        </CollapsiblePanel>
      )}
    </SelectableCardPanel>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
}

const TAB = {
  id: TAB_ID,
  name: T.ScheduledActions,
  icon: ActionIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
