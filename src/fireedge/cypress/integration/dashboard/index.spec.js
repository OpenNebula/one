// / <reference types="Cypress" />

context('Dashboard', () => {
  before(() => {
    cy.visit('/');
    cy.login();
  });

  after(() => {
    cy.logout();
  });

  it('has dashboard title on header', () => {
    cy.get('[data-cy=header-title]').should('have.text', 'dashboard');
  });
});
