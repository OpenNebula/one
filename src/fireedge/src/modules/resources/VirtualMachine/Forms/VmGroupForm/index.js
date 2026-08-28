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
import { useMemo } from 'react'
import { useTheme } from '@mui/material'

import { EmptyContent, FormWithSchema } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { createForm } from '@UtilsModule'
import {
  FIELDS,
  SCHEMA,
  vmGroupSelectionTable,
} from '@modules/resources/VirtualMachine/Forms/VmGroupForm/schema'
import { getStyles } from '@modules/resources/VirtualMachine/Forms/VmGroupForm/styles'

const VmGroupFormContent = () => {
  const theme = useTheme()
  const styles = useMemo(() => getStyles({ theme }), [theme])
  const {
    data: vmGroups = [],
    isFetching,
    isLoading,
  } = vmGroupSelectionTable.useData()

  if (!isFetching && !isLoading && vmGroups.length === 0) {
    return (
      <EmptyContent
        title={T.NoVMGroupsAvailable}
        subtitle={T.NoVMGroupsAvailableDescription}
      />
    )
  }

  return (
    <FormWithSchema
      cy="form-dg"
      fields={FIELDS(vmGroups)}
      rootProps={{ sx: styles.root }}
      gridContainerSx={styles.gridContainer}
      gridItemSx={styles.gridItem}
    />
  )
}

const VmGroupForm = createForm(SCHEMA, FIELDS(), {
  ContentForm: VmGroupFormContent,
})

export default VmGroupForm
