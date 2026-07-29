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
import { jsonToXml } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { BackupJobAPI, useModalsApi } from '@FeaturesModule'

import { Plus } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'
import * as BackupJobs from '@modules/resources/resources/BackupJobs'

import { SubmitButton } from '@ComponentsV2Module'

const AttachVms = memo(({ id, template, isDisabled = false }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()

  const [update] = BackupJobAPI.useUpdateBackupJobMutation()

  const vmDialogSizeProps = {
    dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
    dialogMaxWidth: 'calc(100vw - 32px)',
    dialogMaxHeight: 'calc(100vh - 64px)',
    dialogPaperOverflow: 'visible',
    dialogContentMaxHeight: '50vh',
    dialogContentOverflowY: 'auto',
  }

  const handleEditVms = async ({ BACKUP_VMS } = {}) => {
    const xml = jsonToXml({ ...template, BACKUP_VMS })
    await update({ id, template: xml, replace: 0 })
  }

  const handleOpenForm = () =>
    showModal({
      name: T.SelectVms,
      dialogProps: {
        title: T.SelectVms,
        dataCy: 'modal-edit-vms',
        ...vmDialogSizeProps,
        validateOn: 'onSubmit',
      },
      onSubmit: handleEditVms,
      form: BackupJobs.Forms.AddVmsForm({
        initialValues: template,
      }),
    })

  return (
    <SubmitButton
      data-cy={`edit-vms`}
      iconOnly={<Plus />}
      tooltip={translate(T.SelectVms)}
      type={'secondary'}
      onClick={handleOpenForm}
      label={T.SelectVms}
      isDisabled={isDisabled}
    />
  )
})

AttachVms.propTypes = {
  id: PropTypes.string,
  template: PropTypes.object,
  isDisabled: PropTypes.bool,
}
AttachVms.displayName = 'AttachVms'

export default AttachVms
