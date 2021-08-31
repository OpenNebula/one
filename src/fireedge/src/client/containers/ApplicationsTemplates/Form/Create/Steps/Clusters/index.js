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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useCallback } from 'react'

import { useListForm, useFetch } from 'client/hooks'
import { useCluster, useClusterApi } from 'client/features/One'
import { ListCards } from 'client/components/List'
import { ClusterCard, EmptyCard } from 'client/components/Cards'

import { STEP_FORM_SCHEMA } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Clusters/schema'
import { T } from 'client/constants'

export const STEP_ID = 'clusters'

const Clusters = () => ({
  id: STEP_ID,
  label: T.WhereWillItRun,
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const clusters = useCluster()
    const { getClusters } = useClusterApi()

    const { fetchRequest, loading } = useFetch(getClusters)

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => {
      fetchRequest()
    }, [])

    return (
      <ListCards
        list={clusters}
        isLoading={clusters.length === 0 && loading}
        EmptyComponent={<EmptyCard title={'Your clusters list is empty'} />}
        CardComponent={ClusterCard}
        cardsProps={({ value: { ID } }) => {
          const isSelected = data?.some(selected => selected === ID)
          const handleClick = () => isSelected ? handleUnselect(ID) : handleSelect(ID)

          return { isSelected, handleClick }
        }}
      />
    )
  }, [])
})

export default Clusters
