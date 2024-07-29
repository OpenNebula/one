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
import PropTypes from 'prop-types'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'
import { generateFormFields } from './schema'
import { getValidationFromFields } from 'client/utils'
import { object } from 'yup'
import { useState } from 'react'
import { Box, Pagination, Stack } from '@mui/material'

const FIELDS_PER_PAGE = 10

export const STEP_ID = 'custom_attrs_values'

const Content = (formFields) => {
  const [currentPage, setCurrentPage] = useState(1)

  const pageCount = Math.ceil(formFields?.length / FIELDS_PER_PAGE)

  const fieldsForCurrentPage = formFields.slice(
    (currentPage - 1) * FIELDS_PER_PAGE,
    currentPage * FIELDS_PER_PAGE
  )

  const handlePageChange = (_event, page) => {
    setCurrentPage(page)
  }

  return (
    <Box>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={fieldsForCurrentPage}
      />
      <Stack spacing={2} alignItems="center" mt={2}>
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={handlePageChange}
        />
      </Stack>
    </Box>
  )
}

/**
 * UserInputs Service Template configuration.
 *
 * @param {object} data - Service Template data
 * @returns {object} UserInputs configuration step
 */
const UserInputs = (data) => {
  const customAttrs = data?.dataTemplate?.TEMPLATE?.BODY?.custom_attrs ?? {}

  const userInputs = Object.entries(customAttrs)
    .map(([key, value]) => {
      const parts = value.split('|')
      if (parts.length < 5) return null

      const [mandatory, type, description, rangeOrList, defaultValue] = parts

      return {
        key,
        mandatory,
        type,
        description,
        rangeOrList,
        defaultValue,
      }
    })
    .filter((entry) => entry !== null)

  const formFields = generateFormFields(userInputs)

  const formSchema = object(getValidationFromFields(formFields))

  return {
    id: STEP_ID,
    label: T.UserInputs,
    resolver: formSchema,
    optionsValidate: { abortEarly: false },
    defaultDisabled: {
      condition: () => {
        const exists = !Object.keys(customAttrs ?? {})?.length > 0

        return exists
      },
    },
    content: () => Content(formFields),
  }
}

UserInputs.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { isUpdate: PropTypes.bool }

export default UserInputs
