$: << '../' \
   << './'

require 'opennebula'
require 'helpers/MockClient'

module OpenNebula

    describe "VirtualNetwork using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true

            @xml = VirtualNetwork.build_xml(3)

            client = MockClient.new()
            @vnet = VirtualNetwork.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should allocate the new VNET" do
            @vnet.allocate(nil)

            @vnet.id.should eql(3)
        end

        it "should update the VNET info" do
            @vnet.info()

            @vnet.id.should eql(3)
            @vnet.name.should eql('Red LAN')
        end

        it "should delete the VNET" do
            rc = @vnet.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @vnet['ID'].should eql('3')
            @vnet['NAME'].should eql('Red LAN')
            @vnet['BRIDGE'].should eql('vbr0')
            @vnet['TEMPLATE/NETWORK_ADDRESS'].should eql('192.168.0.0')
            @vnet['TEMPLATE/TYPE'].should eql('RANGED')
            @vnet['LEASES/LEASE/IP'].should eql('192.168.0.1')
            @vnet['LEASES/LEASE/USED'].should eql('1')
        end
    end

    describe "VirtualNetwork using REXML" do
        before(:all) do
            NOKOGIRI=false

            @xml = VirtualNetwork.build_xml(3)

            client = MockClient.new()
            @vnet = VirtualNetwork.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should allocate the new VNET" do
            @vnet.allocate(nil)

            @vnet.id.should eql(3)
        end

        it "should update the VNET info" do
            @vnet.info()

            @vnet.id.should eql(3)
            @vnet.name.should eql('Red LAN')
        end

        it "should delete the VNET" do
            rc = @vnet.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @vnet['ID'].should eql('3')
            @vnet['NAME'].should eql('Red LAN')
            @vnet['BRIDGE'].should eql('vbr0')
            @vnet['TEMPLATE/NETWORK_ADDRESS'].should eql('192.168.0.0')
            @vnet['TEMPLATE/TYPE'].should eql('RANGED')
            @vnet['LEASES/LEASE/IP'].should eql('192.168.0.1')
            @vnet['LEASES/LEASE/USED'].should eql('1')
        end
    end


    describe "VirtualNetwork using NOKOGIRI without id" do
        before(:all) do
            NOKOGIRI=true

            @xml = VirtualNetwork.build_xml()

            client = MockClient.new()
            @vnet = VirtualNetwork.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should get Error getting info" do
            rc = @vnet.info()

            OpenNebula.is_error?(rc).should eql(true)
            @vnet.id.should eql(nil)
            @vnet.name.should eql(nil)
        end

        it "should get Error deleting the VNET" do
            rc = @vnet.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

    describe "VirtualNetwork using REXML without id" do
        before(:all) do
            NOKOGIRI=false

            @xml = VirtualNetwork.build_xml()

            client = MockClient.new()
            @vnet = VirtualNetwork.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should get Error getting info" do
            rc = @vnet.info()

            OpenNebula.is_error?(rc).should eql(true)
            @vnet.id.should eql(nil)
            @vnet.name.should eql(nil)
        end

        it "should get Error deleting the VNET" do
            rc = @vnet.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

end
