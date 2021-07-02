import { CategoryFilter } from 'client/components/Tables/Enhanced/Utils'

export const createColumns = ({ view, resource, columns }) => {
  const filters = view
    ?.find(({ resource_name: name }) => name === resource)
    ?.filters ?? {}

  if (Object.keys(filters).length === 0) return columns

  return columns.map(column => {
    const { Header, id = '', accessor } = column

    const filterById = !!filters[String(id.toLowerCase())]

    const filterByAccessor =
    typeof accessor === 'string' &&
    !!filters[String(accessor.toLowerCase())]

    return {
      ...column,
      ...((filterById || filterByAccessor) &&
      createCategoryFilter(Header)
      )
    }
  })
}

export const createCategoryFilter = title => ({
  disableFilters: false,
  Filter: ({ column }) => CategoryFilter({
    column,
    multiple: true,
    title
  }),
  filter: 'includesValue'
})
