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
import { TranslateProvider } from '@ComponentsModule'
import { useViews } from '@FeaturesModule'
import { ReactElement } from 'react'

import CloudDashboard from '@modules/containers/Dashboard/Sunstone/Cloud'
import SunstoneDashboard from '@modules/containers/Dashboard/Sunstone/General'

/** @returns {ReactElement} Dashboard container */
export function Dashboard() {
  const { view } = useViews()

  return (
    <TranslateProvider>
      {view === 'cloud' ? (
        <CloudDashboard view={view} />
      ) : (
        <SunstoneDashboard view={view} />
      )}
    </TranslateProvider>
  )
}
