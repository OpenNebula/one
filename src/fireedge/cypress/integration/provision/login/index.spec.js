// const { internalLog } = require('../../../support/utils')
// / <reference types="Cypress" />
context('Login', () => {
  before(() => {
    cy.goToIndex(__dirname, () => {
      cy.login()
    })
  })

  after(() => {
    cy.logout()
  })

  it('has successfull login', () => {
    cy.getJWT((JWT) => {
      if (JWT && cy.wrap(JWT).should('exist')) {
        cy.get('[data-cy=header]').should('be.visible')
      }
    })
  })

  it('has username on header', () => {
    cy.get('[data-cy=header-user-button]').click()
    cy.fixture('defaults').then(defaults => {
      cy.get('[data-cy=header-username]').should(
        'have.text',
        defaults.auth.username
      )
    })
  })
})
