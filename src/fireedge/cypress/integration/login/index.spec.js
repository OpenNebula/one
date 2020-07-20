// / <reference types="Cypress" />

context('Login', () => {
  before(() => {
    cy.visit('/');
  });

  after(() => {
    cy.logout();
  });

  /* it('OpenNebula logo', () => {

  }); */

  /* it('requires email', () => {
    cy.get('form').contains('SignIn').click()
    cy.get('.error-email').should('contain', 'email error')
  }); */

  /* it('requires password', () => {
    cy.get('[data-test=email]').type('')
    cy.get('form').contains('SignIn').click()
    cy.get('.error-password').should('contain', 'email error')
  }); */

  /* it('requires valid email and password', () => {
    
  }); */

  it('navigates to dashboard on successfull login', () => {
    cy.login();
    cy.get('[data-cy=header]').should('be.visible');
  });
});
