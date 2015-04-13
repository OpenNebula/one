define(['hbs!'+require.toUrl('tests/templates/multiline')], function(template) {

  describe("Template with multiline comment and quotes", function() {

    it("can load a template containing metadata with linebreaks and quotes", function() {
      expect(template).to.be.a('function');
    });

    it("can parse metadata containing linebreaks", function() {
      var meta = template.meta;
      expect(meta).to.be.an('object');
      var description = meta.description;
      expect(description).to.be.a('string');
      expect(description).to.contain('multiline comment');
    });

    it("can parse metadata containing quotes", function() {
      var meta = template.meta;
      expect(meta).to.be.an("object");
      var description = meta.description;
      expect(description).to.be.a('string');
      expect(description).to.contain("\"quotes\"");
    });

  });

});
