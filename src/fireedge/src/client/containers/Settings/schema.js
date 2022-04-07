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
import { object, boolean, string } from 'yup'
import {
  T,
  INPUT_TYPES,
  SCHEMES,
  DEFAULT_SCHEME,
  DEFAULT_LANGUAGE,
} from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const SCHEME = {
  name: 'SCHEME',
  label: T.Schema,
  type: INPUT_TYPES.SELECT,
  values: [
    { text: T.System, value: SCHEMES.SYSTEM },
    { text: T.Dark, value: SCHEMES.DARK },
    { text: T.Light, value: SCHEMES.LIGHT },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => DEFAULT_SCHEME),
  grid: { md: 12 },
}

const LANGUAGES = {
  name: 'LANG',
  label: T.Language,
  type: INPUT_TYPES.SELECT,
  values: () =>
    window?.langs?.map(({ key, value }) => ({ text: value, value: key })) ?? [],
  validation: string()
    .trim()
    .required()
    .default(() => DEFAULT_LANGUAGE),
  grid: { md: 12 },
}

const DISABLE_ANIMATIONS = {
  name: 'DISABLE_ANIMATIONS',
  label: T.DisableDashboardAnimations,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean()
    .yesOrNo()
    .default(() => false),
  grid: { md: 12 },
}

export const FORM_FIELDS = [SCHEME, LANGUAGES, DISABLE_ANIMATIONS]

export const FORM_SCHEMA = object(getValidationFromFields(FORM_FIELDS))
