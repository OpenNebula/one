import * as React from 'react'
import { useHistory } from 'react-router'

import { ViewList, Add } from '@material-ui/icons'

import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import Circle from 'client/components/Widgets/SimpleCircle'

import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

const cy = 'dashboard-widget-total-provisions'
const title = T.Provisions

const WidgetTotalProvisions = () => {
  const history = useHistory()
  const { provisions, getProvisions } = useProvision()
  const { fetchRequest } = useFetch(getProvisions)

  React.useEffect(() => { fetchRequest() }, [])

  const actions = React.useMemo(() => [
    {
      handleClick: () => history.push(PATH.PROVISIONS.LIST),
      icon: <ViewList />,
      cy: `${cy}-gotolist`
    },
    {
      handleClick: () => history.push(PATH.PROVISIONS.CREATE),
      icon: <Add color='primary' />,
      cy: `${cy}-create`
    }
  ], [history])

  const widget = React.useMemo(() => (
    <Circle label={`${provisions?.length}`} color='#49457b' />
  ), [provisions?.length])

  return { cy, title, actions, widget }
}

WidgetTotalProvisions.displayName = 'WidgetTotalProvisions'

export default WidgetTotalProvisions
