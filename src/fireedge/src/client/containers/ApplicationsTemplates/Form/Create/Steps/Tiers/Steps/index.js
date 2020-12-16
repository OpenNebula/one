import * as yup from 'yup'
import { v4 as uuidv4 } from 'uuid'

import BasicConfiguration from './BasicConfiguration'
import Networks from './Networks'
import Template from './Template'
import Policies from './Policies'

const Steps = () => {
  const basic = BasicConfiguration()
  const networks = Networks()
  const template = Template()
  const policies = Policies()

  const steps = [basic, networks, template, policies]

  const resolvers = () => yup.object({
    id: yup
      .string()
      .uuid()
      .default(uuidv4),
    [basic.id]: basic.resolver,
    [networks.id]: networks.resolver,
    [template.id]: template.resolver,
    [policies.id]: policies.resolver,
    parents: yup.array().default([]),
    position: yup.object({
      x: yup.number().round().default(0),
      y: yup.number().round().default(0)
    })
  })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
