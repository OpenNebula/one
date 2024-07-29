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
import { useCallback, useContext } from 'react'

import { useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { ApplicationNetworkCard } from 'client/components/Cards'

import { STEP_ID as NETWORKING } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { Context } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'
import { T } from 'client/constants'

import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'networks'

const Networks = () => ({
  id: STEP_ID,
  label: T.Networks,
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { nestedForm: list } = useContext(Context)
    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      multiple: true,
      setList: setFormData,
    })

    return (
      <ListCards
        list={list[NETWORKING]}
        CardComponent={ApplicationNetworkCard}
        cardsProps={({ value: { id, name } }) => {
          const isSelected = data?.some((selected) => selected === id)

          return {
            title: name,
            isSelected,
            handleClick: () =>
              isSelected ? handleUnselect(id) : handleSelect(id),
          }
        }}
      />
    )
  }, []),
})

export default Networks
