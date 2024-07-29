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
/* eslint-disable jsdoc/require-jsdoc */
import { useState, useCallback } from 'react'
import { useWatch } from 'react-hook-form'

import { useListForm } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { ListCards } from 'client/components/List'
import { DialogForm } from 'client/components/Dialogs'
import { ApplicationNetworkCard } from 'client/components/Cards'

import { T } from 'client/constants'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'
import { FORM_FIELDS, NETWORK_FORM_SCHEMA, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'networking'

const Networks = () => ({
  id: STEP_ID,
  label: T.ConfigureNetworking,
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const form = useWatch({})
    const [showDialog, setShowDialog] = useState(false)

    const { editingData, handleSave, handleEdit, handleClone, handleRemove } =
      useListForm({
        key: STEP_ID,
        list: data,
        setList: setFormData,
        defaultValue: NETWORK_FORM_SCHEMA.default(),
      })

    return (
      <>
        <ListCards
          list={data}
          CardComponent={ApplicationNetworkCard}
          handleCreate={() => {
            handleEdit()
            setShowDialog(true)
          }}
          cardsProps={({ value: { id } }) => {
            const isUsed = form[TIERS_ID].some(({ networks }) =>
              networks?.includes(id)
            )

            return {
              handleEdit: () => {
                handleEdit(id)
                setShowDialog(true)
              },
              handleClone: () => handleClone(id),
              handleRemove: !isUsed ? () => handleRemove(id) : undefined,
            }
          }}
        />
        {showDialog && (
          <DialogForm
            title={`${T.Networks} form`}
            resolver={() => NETWORK_FORM_SCHEMA}
            open={showDialog}
            values={editingData}
            onSubmit={(values) => {
              handleSave(values)
              setShowDialog(false)
            }}
            onCancel={() => setShowDialog(false)}
          >
            <FormWithSchema cy="form-dg-network" fields={FORM_FIELDS} />
          </DialogForm>
        )}
      </>
    )
  }, []),
})

export default Networks
