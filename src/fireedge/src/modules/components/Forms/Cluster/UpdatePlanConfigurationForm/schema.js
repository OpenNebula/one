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

import { number, string } from 'yup'

import { INPUT_TYPES, T, DRS_POLICY, DRS_AUTOMATION } from '@ConstantsModule'
import {
  getObjectSchemaFromFields,
  sentenceCase,
  arrayToOptions,
} from '@UtilsModule'

const { MANUAL, PARTIAL, FULL } = DRS_AUTOMATION
const { BALANCE, PACK } = DRS_POLICY

const AUTOMATION_TEXT_OPTIONS = {
  [MANUAL]: T.AutomationManual,
  [PARTIAL]: T.AutomationPartial,
  [FULL]: T.AutomationFull,
}

const POLICY_TEXT_OPTIONS = {
  [BALANCE]: T.PolicyBalance,
  [PACK]: T.PolicyPack,
}

const INPUTS = {
  MIGRATION_THRESHOLD: {
    label: T.MigrationThreshold,
    fieldProps: { type: 'number' },
    type: INPUT_TYPES.AUTOCOMPLETE,
    htmlType: INPUT_TYPES.AUTOCOMPLETE,
    values: arrayToOptions(['Unlimited'], {
      addEmpty: false,
      getValue: (_opt) => -1,
      addDescription: true,
      getDescription: (_opt) => T.MigrationThresholdConcept,
    }),
    optionsOnly: false,
    freeSolo: true,
    validation: number()
      .positive()
      .min(-1)
      .required()
      .default(() => -1),
  },
  PREDICTIVE: {
    label: T.Predictive,
    tooltip: T.PredictiveWeightConcept,
    htmlType: INPUT_TYPES.SLIDER,
    validation: number()
      .positive()
      .min(0)
      .max(1)
      .required()
      .default(() => 0),
  },
  POLICY: {
    label: T.Policy,
    type: INPUT_TYPES.AUTOCOMPLETE,
    values: arrayToOptions(Object.values(DRS_POLICY), {
      addEmpty: false,
      addDescription: true,
      getText: (opt) => sentenceCase(opt),
      getDescription: (opt) => POLICY_TEXT_OPTIONS?.[opt],
    }),
    grid: { md: 6.15 },
    htmlType: INPUT_TYPES.AUTOCOMPLETE,
    validation: string()
      .trim()
      .notRequired()
      .oneOf(Object.values(DRS_POLICY))
      .default(() => Object.values(DRS_POLICY)[0]),
  },
  AUTOMATION: {
    label: T.Automation,
    type: INPUT_TYPES.AUTOCOMPLETE,
    htmlType: INPUT_TYPES.AUTOCOMPLETE,
    values: arrayToOptions(Object.values(DRS_AUTOMATION), {
      addEmpty: false,
      addDescription: true,
      getText: (opt) => sentenceCase(opt),
      getDescription: (opt) => AUTOMATION_TEXT_OPTIONS?.[opt],
    }),
    grid: { md: 5.85 },
    validation: string()
      .trim()
      .notRequired()
      .oneOf(Object.values(DRS_AUTOMATION))
      .default(() => Object.values(DRS_AUTOMATION)[1]),
  },
  CPU_USAGE_WEIGHT: {
    label: T.CpuUsage,
    legend: T.BalanceWeights,
    tooltip: T.CpuUsageWeightConcept,
    validation: number()
      .positive()
      .min(0)
      .max(1)
      .required()
      .default(() => 1)
      .afterSubmit((value, { context }) =>
        context?.POLICY.toLowerCase() === 'balance' ? value : undefined
      ),
  },
  CPU_WEIGHT: {
    label: T.Cpu,
    tooltip: T.CpuWeightConcept,
  },
  MEMORY_WEIGHT: {
    label: T.Memory,
    tooltip: T.MemoryWeightConcept,
  },
  NET_WEIGHT: { label: T.Network, tooltip: T.NetWeightConcept },
  DISK_WEIGHT: {
    label: T.Disk,
    tooltip: T.DiskWeightConcept,
  },
}

const generateSliderInputs = function* (inputs) {
  for (const [name, props] of Object.entries(inputs)) {
    yield {
      name,
      fieldProps: { min: 0, max: 1, step: 0.01 },
      type: INPUT_TYPES.SLIDER,
      validation: number()
        .positive()
        .min(0)
        .max(1)
        .required()
        .default(() => 0)
        .afterSubmit((value, { context }) =>
          context?.POLICY.toLowerCase() === 'balance' ? value : undefined
        ),
      grid: { md: 12 },
      dependOf: 'POLICY',
      htmlType: (policy) =>
        policy?.toLowerCase() !== 'balance' && INPUT_TYPES.HIDDEN,
      ...props,
    }
  }
}

export const FIELDS = [...generateSliderInputs(INPUTS)]

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
