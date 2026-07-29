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
import { buildMethods } from '@UtilsModule'

import * as ACLs from '@modules/resources/Forms/ACLs'
import * as Backup from '@modules/resources/Forms/Backup'
import * as BackupJob from '@modules/resources/Forms/BackupJob'
import * as Datastore from '@modules/resources/Forms/Datastore'
import * as File from '@modules/resources/Forms/File'
import * as Image from '@modules/resources/Forms/Image'
import * as OneKsApp from '@modules/resources/Forms/OneKs'
import * as Service from '@modules/resources/Forms/Service'
import * as ServiceTemplate from '@modules/resources/Forms/ServiceTemplate'
import * as Support from '@modules/resources/Forms/Support'
import * as User from '@modules/resources/Forms/User'
import * as Vdc from '@modules/resources/Forms/Vdc'
import * as VmGroup from '@modules/resources/Forms/VmGroup'
import * as Vn from '@modules/resources/Forms/VNetwork'
import * as VrTemplate from '@modules/resources/Forms/VrTemplate'
import { FormWithSchema, Legend } from '@ComponentsV2Module'

buildMethods()

export { FormWithSchema, Legend }

export const Form = {
  ACLs,
  Backup,
  BackupJob,
  Datastore,
  File,
  Image,
  OneKsApp,
  Service,
  ServiceTemplate,
  Support,
  User,
  Vdc,
  VmGroup,
  Vn,
  VrTemplate,
}
