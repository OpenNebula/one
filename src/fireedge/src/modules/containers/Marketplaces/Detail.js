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
import { ReactElement, useEffect } from 'react'
import { useParams, Redirect } from 'react-router-dom'
import { useGeneralApi } from '@FeaturesModule'
import { TranslateProvider, MarketplaceTabs } from '@ComponentsModule'

/**
 * Displays the detail information about a Marketplace.
 *
 * @returns {ReactElement} Marketplace detail component.
 */
export function MarketplaceDetail() {
  const { setSecondTitle } = useGeneralApi()
  useEffect(() => setSecondTitle({}), [])

  const { id } = useParams()

  if (Number.isNaN(+id)) {
    return <Redirect to="/" />
  }

  return (
    <TranslateProvider>
      <MarketplaceTabs id={id} />
    </TranslateProvider>
  )
}
