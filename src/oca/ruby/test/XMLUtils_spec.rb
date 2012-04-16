$: << '..'


require 'rexml/document'
require 'OpenNebula/XMLUtils'

    shared_examples "modifying XML" do
        it "add a new element '.', 'B2' => 'bdos'" do
            @xml_element.add_element('.', 'B2' => 'bdos')

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
  <B2>bdos</B2>
</V1>"
        end

        it "add a new element '.', 'V2' => {'CC3' => 'cctres'}" do
            @xml_element.add_element('.', 'V2' => {'CC3' => 'cctres'})

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
  <B2>bdos</B2>
  <V2>
    <CC3>cctres</CC3>
  </V2>
</V1>"
        end

        it "add a new element 'V2', 'DD4' => 'ddcuatro'" do
            @xml_element.add_element('V2', 'DD4' => 'ddcuatro')

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
  <B2>bdos</B2>
  <V2>
    <CC3>cctres</CC3>
    <DD4>ddcuatro</DD4>
  </V2>
</V1>"
        end

        it "delete an element 'B2'" do
            @xml_element.delete_element('B2')

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
  <V2>
    <CC3>cctres</CC3>
    <DD4>ddcuatro</DD4>
  </V2>
</V1>"
        end

        it "delete an element 'V2/DD4'" do
            @xml_element.delete_element('V2/DD4')

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
  <V2>
    <CC3>cctres</CC3>
  </V2>
</V1>"
        end

        it "delete an element 'V2'" do
            @xml_element.delete_element('V2')

            @xml_element.to_xml(true).should eql "<V1>
  <A1>auno</A1>
</V1>"
        end
    end

    describe 'NOKOGIRI' do
        before :all do
            xml = "<V1><A1>auno</A1></V1>"
    
            bxml = OpenNebula::XMLElement.build_xml(xml, "V1")
            bxml.class.to_s.should eql('Nokogiri::XML::NodeSet')
    
            @xml_element = OpenNebula::XMLElement.new(bxml)
        end

        it_behaves_like "modifying XML"
    end

    describe 'REXML' do
        before :all do
            OpenNebula::NOKOGIRI = false
    
            xml = "<V1><A1>auno</A1></V1>"
    
            bxml = OpenNebula::XMLElement.build_xml(xml, "V1")
            bxml.class.to_s.should eql('REXML::Element')
    
            @xml_element = OpenNebula::XMLElement.new(bxml)
        end

        it_behaves_like "modifying XML"
    end