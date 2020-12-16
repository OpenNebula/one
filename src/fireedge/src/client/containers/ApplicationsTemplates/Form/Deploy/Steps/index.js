import * as yup from 'yup'

import BasicConfiguration from './BasicConfiguration'
import Networking, { STEP_ID as NETWORKING_ID } from './Networking'
import Tiers, { STEP_ID as TIERS_ID } from './Tiers'

const Steps = ({ applicationTemplate = {}, vmTemplates }) => {
  const {
    [TIERS_ID]: appTiers,
    [NETWORKING_ID]: appNetworking
  } = applicationTemplate

  const basic = BasicConfiguration()
  const tiers = Tiers({ tiers: appTiers, vmTemplates })
  const networking = Networking()

  const steps = [basic, tiers]
  appNetworking?.length > 0 && steps.push(networking)

  const resolvers = () => yup
    .object(steps.reduce((res, step) => ({
      ...res, [step.id]: step.resolver
    }), {}))

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
