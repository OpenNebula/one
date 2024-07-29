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
import { DateTime } from 'luxon'

/**
 * Get the default date range: today and seven days ago.
 *
 * @returns {{startDate: DateTime, endDate: DateTime}} Object containing the start and end dates.
 */
export const getDefaultDateRange = () => {
  const today = DateTime.now()
  const sevenDaysAgo = DateTime.now().minus({ days: 1 })

  return {
    startDate: sevenDaysAgo,
    endDate: today,
  }
}
