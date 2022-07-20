/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import Datastore, {
  STEP_ID as DATASTORE_ID,
} from 'client/components/Forms/Image/CloneForm/Steps/DatastoresTable'

import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/Image/CreateDockerfile/Steps/General'

import Dockerfile, {
  STEP_ID as DOCKERFILE_ID,
} from 'client/components/Forms/Image/CreateDockerfile/Steps/Dockerfile'

import { jsonToXml } from 'client/models/Helper'
import { createSteps, cloneObject, set } from 'client/utils'

const Steps = createSteps([General, Datastore, Dockerfile], {
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: general = {},
      [DATASTORE_ID]: [datastore] = [],
      [DOCKERFILE_ID]: dockerfile = {},
    } = formData ?? {}

    const generalData = cloneObject(general)
    set(generalData, 'CONTEXT', undefined)
    set(generalData, 'SIZE', undefined)

    return {
      template: jsonToXml({
        ...{
          PATH: `dockerfile://?fileb64=${dockerfile.PATH}&amp;context=${general.CONTEXT}&amp;size=${general.SIZE}`,
        },
        ...generalData,
      }),
      datastore: datastore?.ID,
    }
  },
})

export default Steps
