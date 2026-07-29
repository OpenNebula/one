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
import { Component, useEffect } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Group as RoleIcon } from 'iconoir-react'
import {
  FIELDS,
  SCHEMA,
  TEMPLATE_ID_FIELD,
  getDefaultRole,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/schemas'

import {
  PoliciesDropdown,
  NetworksDropdown,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/dropdowns'

import { Skeleton, Stack } from '@mui/material'
import { T } from '@ConstantsModule'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'
import { vmtemplateTable } from '@ModelsModule'

export const STEP_ID = 'roles'

const standaloneExcludedFields = ['parents']

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.standaloneModal - Render as AddRoleDialog
 *@returns {Component} - Role definitions step
 */
const Content = ({ standaloneModal = false }) => {
  const { watch, setValue } = useFormContext()

  const wRoles = watch(`${STEP_ID}`)

  const {
    fields: roles,
    remove,
    append,
  } = useFieldArray({
    name: `${STEP_ID}`,
  })

  const {
    selectedIndex: selectedRole,
    setSelectedIndex: setSelectedRole,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: roles,
    onAdd: () => append(getDefaultRole()),
    onRemove: remove,
  })

  const selectedTemplateId = watch(`${STEP_ID}.${selectedRole}.template_id`)
  const { data: vmTemplates = [] } = vmtemplateTable.useData()

  const isVr = wRoles?.[selectedRole]?.type === 'vr'

  useEffect(() => {
    if (
      selectedRole === null ||
      selectedTemplateId === undefined ||
      selectedTemplateId === ''
    ) {
      return
    }

    const selectedTemplate = vmTemplates?.find(
      ({ ID }) => String(ID) === String(selectedTemplateId)
    )

    if (!selectedTemplate) return

    const isVirtualRouter =
      String(selectedTemplate?.TEMPLATE?.VROUTER ?? '').toUpperCase() === 'YES'
    const nextType = isVirtualRouter ? 'vr' : 'vm'

    if (wRoles?.[selectedRole]?.type !== nextType) {
      setValue(`${STEP_ID}.${selectedRole}.type`, nextType)
    }
  }, [
    selectedRole,
    selectedTemplateId,
    vmTemplates,
    wRoles?.[selectedRole]?.type,
  ])

  if (!wRoles?.length || !roles?.length) {
    return (
      <Stack direction="row" spacing={2}>
        <Skeleton variant="rectangular" width="25%" height={300} />
        <Skeleton variant="rectangular" width="75%" height={300} />
      </Stack>
    )
  }

  return (
    <SelectableCardPanel
      items={roles}
      selectedIndex={selectedRole}
      onSelect={setSelectedRole}
      onAdd={handleAdd}
      onRemove={handleRemove}
      canRemove={(_, idx) => idx !== selectedRole}
      allowRemoveAll={false}
      addLabel={T.AddRole}
      addButtonCy="extra-add-role"
      getItemKey={(role, idx) => `${idx}-${role?.id}-${role?.name}`}
      cardIcon={RoleIcon}
      renderCardTitle={(_, idx) => watch(`${STEP_ID}.${idx}.name`) || T.NewRole}
      renderCardSubtitle={(_, idx) =>
        `${watch(`${STEP_ID}.${idx}.cardinality`) ?? 0} ${T.VMs}`
      }
      showSidebar={!standaloneModal}
    >
      {selectedRole != null && (
        <Stack
          key={`roles-${roles?.[selectedRole]?.id}`}
          direction="column"
          alignItems="flex-start"
          width="100%"
          sx={{ padding: standaloneModal ? 1 : 0 }}
        >
          <CollapsiblePanel title={T.Type} isDefaultCollapsed={false}>
            <FormWithSchema
              id={`${STEP_ID}.${selectedRole}`}
              cy={`${STEP_ID}`}
              fields={FIELDS?.filter(
                ({ name }) =>
                  !standaloneModal || !standaloneExcludedFields?.includes(name)
              )}
            />
          </CollapsiblePanel>

          {!standaloneModal && (
            <NetworksDropdown roles={wRoles} selectedRole={selectedRole} />
          )}
          {!isVr && (
            <PoliciesDropdown roles={roles} selectedRole={selectedRole} />
          )}
          <CollapsiblePanel title={T.SelectTemplate} isDefaultCollapsed={false}>
            <FormWithSchema
              id={`${STEP_ID}.${selectedRole}`}
              fields={[{ ...TEMPLATE_ID_FIELD, label: undefined }]}
              cy={`${STEP_ID}`}
            />
          </CollapsiblePanel>
        </Stack>
      )}
    </SelectableCardPanel>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
  standaloneModal: PropTypes.bool,
}

/**
 *@returns {Component} - Roles definition step
 */
const Step = () => ({
  id: STEP_ID,
  content: Content,
  label: T.Roles,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
})

export default Step
