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
import { AddVmsForm } from 'client/components/Forms/BackupJob'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { useUpdateBackupJobMutation } from 'client/features/OneApi/backupjobs'
import { jsonToXml } from 'client/models/Helper'
import Edit from 'iconoir-react/dist/Edit'
import PropTypes from 'prop-types'
import { memo } from 'react'

const AttachVms = memo(({ id, template }) => {
  const [update] = useUpdateBackupJobMutation()
  const formConfig = {
    initialValues: template,
  }

  const handleEditVms = async ({ BACKUP_VMS } = {}) => {
    const xml = jsonToXml({ ...template, BACKUP_VMS })
    await update({ id, template: xml, replace: 0 })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `edit-vms`,
        icon: <Edit />,
        tooltip: Tr(T.Edit),
        variant: 'outlined',
      }}
      options={[
        {
          cy: 'edit-vms',
          name: T.Image,
          dialogProps: {
            title: T.SelectVms,
            dataCy: 'modal-edit-vms',
          },
          form: () => AddVmsForm(formConfig),
          onSubmit: handleEditVms,
        },
      ]}
    />
  )
})

AttachVms.propTypes = {
  id: PropTypes.string,
  template: PropTypes.object,
}
AttachVms.displayName = 'AttachVms'

export default AttachVms
