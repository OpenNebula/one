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

import { TemplateSelectorDialog } from '@ComponentsModule'
import { PATH, T } from '@ConstantsModule'
import { servicetemplateTable } from '@ModelsModule'
import { Services } from '@modules/containers/Services/Services'

/**
 * Displays the service create template selector.
 *
 * @returns {ReactElement} Services list with template selector dialog
 */
export function CreateService() {
  const history = useHistory()
  const { data = [], isFetching, refetch } = servicetemplateTable.useData()

  return (
    <>
      <Services />
      <TemplateSelectorDialog
        title={T.SelectTemplate}
        table={servicetemplateTable}
        data={data}
        isRefreshing={isFetching}
        onRefresh={refetch}
        onClose={() => history.replace(PATH.INSTANCE.SERVICES.LIST)}
        onSelect={(template) =>
          history.push(PATH.TEMPLATE.SERVICES.INSTANTIATE, template)
        }
      />
    </>
  )
}
