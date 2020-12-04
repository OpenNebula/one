import * as React from 'react'
import { useHistory } from 'react-router'

import { AddCircle } from '@material-ui/icons'

import { useFetch, useProvision } from 'client/hooks'
import Circle from 'client/components/Widgets/SimpleCircle'

import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

const cy = 'dashboard-widget-total-provisions'
const title = T.Provisions

const TotalProvisions = () => {
  const history = useHistory()
  const { provisions, getProvisions } = useProvision()
  const { fetchRequest } = useFetch(getProvisions)

  React.useEffect(() => { fetchRequest() }, [])

  const actions = React.useMemo(() => [{
    handleClick: () => history.push(PATH.PROVISIONS.CREATE),
    icon: <AddCircle />,
    cy: `${cy}-create`
  }], [history])

  const widget = React.useMemo(() => (
    <Circle
      label={`${provisions?.length}`}
      onClick={() => history.push(PATH.PROVISIONS.LIST)}
    />
  ), [provisions?.length])

  return { cy, title, actions, widget }
}

TotalProvisions.displayName = 'TotalProvisions'

export default TotalProvisions
