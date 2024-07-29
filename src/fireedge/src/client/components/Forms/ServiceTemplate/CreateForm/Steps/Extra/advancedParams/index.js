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
import { useForm, FormProvider } from 'react-hook-form'
import { useMemo, memo } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  ADVANCED_PARAMS_FIELDS,
  ADVANCED_PARAMS_SCHEMA,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams/schema'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Stack, Divider, FormControl } from '@mui/material'

import { T } from 'client/constants'

export const SECTION_ID = 'ADVANCED'

const AdvancedParamsSection = () => {
  const fields = useMemo(() => ADVANCED_PARAMS_FIELDS, [])

  const { handleSubmit, ...methods } = useForm({
    defaultValues: ADVANCED_PARAMS_SCHEMA?.default(),
    mode: 'all',
    resolver: yupResolver(ADVANCED_PARAMS_SCHEMA),
  })

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', gridColumn: '1 / -1' }}
    >
      <Legend title={T.AdvancedParams} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
        >
          <FormWithSchema
            cy={SECTION_ID}
            fields={fields}
            rootProps={{ sx: { m: 0 } }}
          />
        </Stack>
      </FormProvider>
      <Divider />
    </FormControl>
  )
}

export default memo(AdvancedParamsSection)
