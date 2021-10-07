/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Typography } from '@mui/material'

import { createForm } from 'client/utils'
import { SCHEMA, FIELDS } from 'client/components/Forms/Vm/RecoverForm/schema'

const RecoverForm = createForm(
  SCHEMA,
  FIELDS,
  {
    description: (
      <Typography variant='subtitle1' paddingX='1rem'>
        {`Recovers a stuck VM that is waiting for a driver operation.
          The recovery may be done by failing, succeeding or retrying the
          current operation. YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST,
          to decide if the operation was successful or not, or if it can be retried.`}
      </Typography>
    )
  }
)

export default RecoverForm
