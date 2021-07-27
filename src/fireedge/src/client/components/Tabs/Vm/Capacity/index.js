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
import * as React from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { useDialog } from 'client/hooks'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { DialogForm } from 'client/components/Dialogs'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { SCHEMA, FIELDS } from 'client/formSchema/Vm/resize'

import InformationPanel from 'client/components/Tabs/Vm/Capacity/information'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T } from 'client/constants'

const VmCapacityTab = ({ tabProps: { actions = [] } = {} }) => {
  const { display, show, hide } = useDialog()
  const { resize } = useVmApi()

  const { handleRefetch, data: vm = {} } = React.useContext(TabContext)
  const { ID, TEMPLATE } = vm

  const hypervisor = VirtualMachine.getHypervisor(vm)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  const handleResize = async formData => {
    const { enforce, ...restOfData } = formData
    const template = Helper.jsonToXml({ ROOT: restOfData })

    const response = await resize(ID, { enforce, template })
    String(response) === String(ID) && await handleRefetch?.()
    hide()
  }

  return (
    <>
      <InformationPanel
        actions={actionsAvailable}
        handleOpenResizeDialog={show}
        vm={vm}
      />
      {display && (
        <DialogForm
          title={`${T.ResizeCapacity}`}
          resolver={() => SCHEMA}
          values={SCHEMA.cast(TEMPLATE, { stripUnknown: true })}
          onCancel={hide}
          onSubmit={handleResize}
        >
          <FormWithSchema cy='form-dg-vm-resize' fields={FIELDS} />
        </DialogForm>
      )}
    </>
  )
}

VmCapacityTab.propTypes = {
  tabProps: PropTypes.object
}

VmCapacityTab.displayName = 'VmCapacityTab'

export default VmCapacityTab
