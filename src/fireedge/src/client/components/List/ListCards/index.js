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
import PropTypes from 'prop-types'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import {
  CardActionArea,
  Card,
  Grid,
  LinearProgress,
  useMediaQuery,
} from '@mui/material'
import { Plus as PlusIcon } from 'iconoir-react'

import { EmptyCard } from 'client/components/Cards'
import FloatingActionButton from 'client/components/Fab'
import listCardsStyles from 'client/components/List/ListCards/styles'
import { camelCase } from 'client/utils'

const ListCards = ({
  list,
  keyProp,
  breakpoints,
  handleCreate,
  ButtonCreateComponent,
  CardComponent,
  cardsProps,
  EmptyComponent,
  displayEmpty,
  isLoading,
  gridProps,
}) => {
  const classes = listCardsStyles()
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

  return (
    <>
      {isLoading && (
        <LinearProgress color="secondary" className={classes.loading} />
      )}
      <Grid container spacing={3} {...gridProps}>
        {/* CREATE CARD COMPONENT */}
        {handleCreate &&
          (ButtonCreateComponent ? (
            <ButtonCreateComponent onClick={handleCreate} />
          ) : isMobile ? (
            <FloatingActionButton icon={<PlusIcon />} onClick={handleCreate} />
          ) : (
            <Grid item {...breakpoints}>
              <Card className={classes.cardPlus} raised>
                <CardActionArea onClick={handleCreate}>
                  <PlusIcon />
                </CardActionArea>
              </Card>
            </Grid>
          ))}

        {/* LIST */}
        {list.length > 0 ? (
          <TransitionGroup component={null}>
            {list?.map((value, index) => {
              const key = value[keyProp] ?? value[keyProp.toUpperCase()]

              return (
                <CSSTransition
                  // use key to render transition (default: id or ID)
                  key={`card-${camelCase(key)}`}
                  classNames={classes.item}
                  timeout={400}
                >
                  <Grid item {...breakpoints} {...value?.breakpoints}>
                    <CardComponent
                      value={value}
                      {...cardsProps({ index, value })}
                    />
                  </Grid>
                </CSSTransition>
              )
            })}
          </TransitionGroup>
        ) : (
          (displayEmpty || EmptyComponent) && (
            <Grid item {...breakpoints}>
              {EmptyComponent ?? <EmptyCard title={'Your list is empty'} />}
            </Grid>
          )
        )}
      </Grid>
    </>
  )
}

const gridValues = [false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

ListCards.propTypes = {
  list: PropTypes.arrayOf(PropTypes.any).isRequired,
  keyProp: PropTypes.string,
  breakpoints: PropTypes.shape({
    xs: PropTypes.oneOf(gridValues),
    sm: PropTypes.oneOf(gridValues),
    md: PropTypes.oneOf(gridValues),
    lg: PropTypes.oneOf(gridValues),
    xl: PropTypes.oneOf(gridValues),
  }),
  handleCreate: PropTypes.func,
  ButtonCreateComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.object,
    PropTypes.element,
  ]),
  CardComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.object,
    PropTypes.element,
  ]),
  cardsProps: PropTypes.func,
  EmptyComponent: PropTypes.oneOfType([PropTypes.element]),
  displayEmpty: PropTypes.bool,
  isLoading: PropTypes.bool,
  gridProps: PropTypes.shape({
    'data-cy': PropTypes.string,
  }),
}

ListCards.defaultProps = {
  list: [],
  keyProp: 'id',
  breakpoints: { xs: 12, sm: 6, md: 4, xl: 3 },
  handleCreate: undefined,
  ButtonCreateComponent: undefined,
  CardComponent: null,
  cardsProps: () => undefined,
  EmptyComponent: undefined,
  displayEmpty: false,
  isLoading: false,
  gridProps: {},
}

ListCards.displayName = 'ListCards'

export default ListCards
