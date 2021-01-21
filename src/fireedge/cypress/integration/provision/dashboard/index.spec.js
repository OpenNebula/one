// / <reference types="Cypress" />

context('Dashboard', () => {
  before(() => {
    cy.visit('/')
    cy.login()
  })

  after(() => {
    cy.logout()
  })

  it('validate items', () => {
    
  })
})
