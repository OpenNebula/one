define(['hbs!'+require.toUrl('tests/templates/helpers')], function(template) {

  describe("Helpers embedded in a template", function() {

    it("can be rendered", function() {
      expect(typeof template).to.equal('function');
      var html = template({hello: 'world'});
      var container = document.createElement('div');
      container.innerHTML=html;
      var text = container.innerText.trim();
      expect(text).to.equal('This is a very simple template )foo(');
    });

  });

});
