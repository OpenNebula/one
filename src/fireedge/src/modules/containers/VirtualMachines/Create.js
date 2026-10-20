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

import { ReactElement, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router'

import { TemplateSelectorDialog } from '@ComponentsModule'
import { PATH, T } from '@ConstantsModule'
import { vmtemplateTable } from '@ModelsModule'
import { VirtualMachines } from '@modules/containers/VirtualMachines/VirtualMachines'

/**
 * Displays the VM create template selector.
 *
 * @returns {ReactElement} Virtual machines list with template selector dialog
 */
export function CreateVm() {
  const history = useHistory()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vmtemplateTable.useData()

  const templates = useMemo(
    () =>
      data?.filter(({ TEMPLATE = {} } = {}) => TEMPLATE?.VROUTER !== 'YES') ??
      [],
    [data]
  )

  const handleClose = useCallback(() => {
    history.replace(PATH.INSTANCE.VMS.LIST)
  }, [history])

  const redirectToInstantiate = useCallback(
    (template) => {
      history.push(PATH.TEMPLATE.VMS.INSTANTIATE, {
        ...template,
        navigateUrl: 'vm',
      })
    },
    [history]
  )

  return (
    <>
      <VirtualMachines />
      <TemplateSelectorDialog
        title={T.SelectVmTemplate}
        table={vmtemplateTable}
        data={templates}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onClose={handleClose}
        onSelect={redirectToInstantiate}
      />
    </>
  )
}
