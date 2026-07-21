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
import { ReactElement } from 'react'
import { useHistory } from 'react-router'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
  BackupJobs,
} from '@ResourcesModule'

import { jsonToXml } from '@UtilsModule'
import { BackupJobAPI, useGeneralApi } from '@FeaturesModule'

import { T, PATH } from '@ConstantsModule'

/**
 * Displays the creation or modification form to a BackupJob.
 *
 * @returns {ReactElement} Backup Job form
 */
export function CreateBackupJob() {
  const history = useHistory()

  const { enqueueSuccess } = useGeneralApi()
  const [create] = BackupJobAPI.useCreateBackupJobMutation()

  const onSubmit = async (template) => {
    try {
      const newBackupJobId = await create({
        template: jsonToXml(template),
      }).unwrap()
      if (newBackupJobId !== undefined && newBackupJobId !== null) {
        history.push(PATH.STORAGE.BACKUPJOBS.LIST)
        enqueueSuccess(T.SuccessBackupJobCreated, newBackupJobId)
      }
    } catch {}
  }

  return (
    <>
      <BackupJobs.Forms.CreateForm
        onSubmit={onSubmit}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </BackupJobs.Forms.CreateForm>
    </>
  )
}
