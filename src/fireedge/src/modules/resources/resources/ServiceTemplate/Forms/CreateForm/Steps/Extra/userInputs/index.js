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
import { InputField as UserInputsIcon } from 'iconoir-react'
import { USER_INPUTS_FIELDS } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/userInputs/schema'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'
import { sentenceCase } from '@UtilsModule'
import { Stack } from '@mui/material'
import { T } from '@ConstantsModule'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'

export const TAB_ID = 'user_inputs'

const Content = () => {
  const { watch } = useFormContext()

  const wUserInputs = watch(`${EXTRA_ID}.${TAB_ID}`)

  const {
    fields: userinputs,
    remove,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const handleAppend = () => {
    append({
      type: '',
      mandatory: false,
      name: '',
      description: '',
      options: '',
      default: '',
    })
  }

  const {
    selectedIndex: selectedUInput,
    setSelectedIndex: setSelectedUInput,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: userinputs,
    onAdd: handleAppend,
    onRemove: remove,
  })

  return (
    <SelectableCardPanel
      items={userinputs}
      selectedIndex={selectedUInput}
      onSelect={setSelectedUInput}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={T.AddUserInput}
      addButtonCy="extra-add-userinput"
      getItemKey={(userinput, idx) =>
        `${idx}-${userinput?.id}-${userinput?.name}`
      }
      cardIcon={UserInputsIcon}
      renderCardTitle={(_, idx) =>
        watch(`${EXTRA_ID}.${TAB_ID}.${idx}.name`) || T.NewUserInput
      }
      renderCardSubtitle={(_, idx) =>
        sentenceCase(watch(`${EXTRA_ID}.${TAB_ID}.${idx}.type`)) ||
        `${T.No} ${T.Type}`
      }
    >
      {selectedUInput != null && wUserInputs?.length > 0 && (
        <CollapsiblePanel
          key={`inputs-${userinputs?.[selectedUInput]?.id}`}
          title={T.Type}
          isDefaultCollapsed={false}
        >
          <Stack
            direction="column"
            alignItems="flex-start"
            gap="0.5rem"
            component="form"
            width="100%"
          >
            <FormWithSchema
              key={`inputs-table-${userinputs?.[selectedUInput]?.id}`}
              cy={`${TAB_ID}`}
              id={`${EXTRA_ID}.${TAB_ID}.${selectedUInput}`}
              fields={USER_INPUTS_FIELDS}
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
  name: T.UserInputs,
  icon: UserInputsIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
