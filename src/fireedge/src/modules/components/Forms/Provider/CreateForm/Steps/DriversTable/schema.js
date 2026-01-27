/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { DriversTable } from '@modules/components/Tables'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields } from '@UtilsModule'
import { string, ArraySchema } from 'yup'
import { findIndex } from 'lodash'

const DRIVER = (driversSteps) => {
  const stepControl = []

  driversSteps?.forEach((driver, indexDriver) => {
    if (driver?.hasSteps) {
      const stepControlDriver = {
        condition: (value) =>
          findIndex(driversSteps, { name: value }) !== indexDriver,
        steps: [driversSteps[indexDriver]?.name],
      }

      stepControl.push(stepControlDriver)
    }
  })

  return {
    name: 'DRIVER',
    label: T.Drivers,
    type: INPUT_TYPES.TABLE,
    Table: () => DriversTable.Table,
    getRowId: (row) => String(row.name),
    validation: string()
      .trim()
      .required()
      .default(() => undefined),
    grid: { md: 12 },
    fieldProps: {
      filterData: (drivers) =>
        drivers.filter(
          (driver) =>
            driver.name.toLowerCase() !== 'onprem' && driver.state === 'ENABLED'
        ),
    },
    stepControl: stepControl || undefined,
  }
}

/**
 * @param {object} driversSteps - Associated steps for each driver
 * @returns {Field[]} Fields
 */
const FIELDS = (driversSteps) => [DRIVER(driversSteps)]

/** @type {ArraySchema} Drivers table schema */
const SCHEMA = (driversSteps) => getObjectSchemaFromFields(FIELDS(driversSteps))

export { SCHEMA, FIELDS }
