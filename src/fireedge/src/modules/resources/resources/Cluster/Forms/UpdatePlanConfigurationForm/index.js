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
import {
  SCHEMA,
  FIELDS,
  SECTIONS,
} from '@modules/resources/resources/Cluster/Forms/UpdatePlanConfigurationForm/schema'
import { FormWithSchema } from '@ComponentsV2Module'
import { createForm } from '@UtilsModule'

const FORM_GRID_CONTAINER_SX = {
  m: 0,
  width: '100%',
}

const FORM_GRID_ITEM_SX = {
  minWidth: 0,
  maxWidth: '100%',
}

const FORM_ROOT_SX = {
  border: 0,
  boxSizing: 'border-box',
  m: 0,
  minWidth: 0,
  overflow: 'visible',
  p: 0,

  '& .MuiGrid-root': {
    minWidth: 0,
    maxWidth: '100%',
  },

  '& .dropdown, & .dropdown-input-wrapper': {
    minWidth: 0,
    maxWidth: '100%',
  },

  '& .form-legend': {
    minWidth: 0,
    maxWidth: '100%',

    '& .MuiTypography-root': {
      minWidth: 0,
      maxWidth: '100%',
      overflowWrap: 'anywhere',
    },
  },

  '& .MuiStack-root': {
    alignItems: 'center',
    boxSizing: 'border-box',
    columnGap: '12px',
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'minmax(120px, 1fr) minmax(160px, 200px)',
    },
    marginTop: '8px',
    minWidth: 0,
    paddingLeft: {
      xs: 0,
      sm: '12px',
    },
    rowGap: '10px',
    width: '100%',

    '& > :not(style) + :not(style)': {
      marginLeft: '0 !important',
    },

    '& > .MuiSlider-root': {
      minWidth: 0,
      width: '100%',
    },

    '& > .MuiFormControl-root': {
      maxWidth: '100%',
      minWidth: 0,
      width: '100%',
    },

    '& .MuiInputBase-root': {
      minWidth: 0,
    },
  },
}

const UpdatePlanConfigurationFormContent = () => (
  <>
    {SECTIONS.map(({ id, ...section }) => (
      <FormWithSchema
        key={id}
        cy="form-dg"
        rootProps={{ sx: FORM_ROOT_SX }}
        gridContainerSx={FORM_GRID_CONTAINER_SX}
        gridItemSx={FORM_GRID_ITEM_SX}
        {...section}
      />
    ))}
  </>
)

const UpdatePlanConfigurationForm = createForm(SCHEMA, FIELDS, {
  ContentForm: UpdatePlanConfigurationFormContent,
  transformInitialValue: (clusterTemplate, schema) => {
    const formatTemplate = Object.entries(clusterTemplate)?.reduce(
      (acc, [k, v]) => {
        acc[k] = k?.endsWith('_WEIGHT') ? v * 100 : v

        return acc
      },
      {}
    )

    const knownTemplate = schema.cast(formatTemplate)

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => ({
    ONE_DRS: formData,
  }),
})

export default UpdatePlanConfigurationForm
