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
import { ReactElement } from 'react'
import { useHistory } from 'react-router'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/BackupJob'
import { useGeneralApi } from 'client/features/General'
import { useCreateBackupJobMutation } from 'client/features/OneApi/backupjobs'
import { jsonToXml } from 'client/models/Helper'
import { T } from 'client/constants'

/**
 * Displays the creation or modification form to a BackupJob.
 *
 * @returns {ReactElement} Backup Job form
 */
function CreateBackupJob() {
  const history = useHistory()

  const { enqueueSuccess } = useGeneralApi()
  const [create] = useCreateBackupJobMutation()

  const onSubmit = async (template) => {
    try {
      const newBackupJobId = await create({
        template: jsonToXml(template),
      }).unwrap()
      if (newBackupJobId) {
        history.push(PATH.STORAGE.BACKUPJOBS.LIST)
        enqueueSuccess(T.SuccessBackupJobCreated, newBackupJobId)
      }
    } catch {}
  }

  return (
    <CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateBackupJob
