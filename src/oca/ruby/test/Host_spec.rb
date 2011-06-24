$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "Host using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = Host.build_xml(7)
            
            client = MockClient.new()
            @host = Host.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should allocate the new HOST" do
            @host.allocate(nil,nil,nil,nil)

            @host.id.should eql(7)
        end
        
        it "should update the HOST info" do
            @host.info()
            
            @host.id.should eql(7)
            @host.name.should eql('dummyhost')
            @host.state.should eql(2)
            @host.state_str.should eql('MONITORED')
            @host.short_state_str.should eql('on')
        end

        it "should enable the HOST" do
            rc = @host.enable()

            rc.should eql(nil)
        end

        it "should disable the HOST" do
            rc = @host.disable()

            rc.should eql(nil)
        end

        it "should delete the HOST" do
            rc = @host.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @host['ID'].should eql('7')
            @host['NAME'].should eql('dummyhost')
            @host['STATE'].should eql('2')
            @host['IM_MAD'].should eql('im_dummy')
            @host['LAST_MON_TIME'].should eql('1277733596')
            @host['HOST_SHARE/MEM_USAGE'].should eql('1572864')
            @host['HOST_SHARE/CPU_USAGE'].should eql('300')
            @host['HOST_SHARE/FREE_CPU'].should eql('800')
            @host['HOST_SHARE/RUNNING_VMS'].should eql('3')
            @host['TEMPLATE/CPUSPEED'].should eql('2.2GHz')
            @host['TEMPLATE/HYPERVISOR'].should eql('dummy')
            @host['TEMPLATE/TOTALMEMORY'].should eql('16777216')
        end
    end

    describe "Host using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = Host.build_xml(7)
            
            client = MockClient.new()
            @host = Host.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should allocate the new HOST" do
            @host.allocate(nil,nil,nil,nil)

            @host.id.should eql(7)
        end
        
        it "should update the HOST info" do
            @host.info()
            
            @host.id.should eql(7)
            @host.name.should eql('dummyhost')
            @host.state.should eql(2)
            @host.state_str.should eql('MONITORED')
            @host.short_state_str.should eql('on')
        end

        it "should enable the HOST" do
            rc = @host.enable()

            rc.should eql(nil)
        end

        it "should disable the HOST" do
            rc = @host.disable()

            rc.should eql(nil)
        end

        it "should delete the HOST" do
            rc = @host.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @host['ID'].should eql('7')
            @host['NAME'].should eql('dummyhost')
            @host['STATE'].should eql('2')
            @host['IM_MAD'].should eql('im_dummy')
            @host['LAST_MON_TIME'].should eql('1277733596')
            @host['HOST_SHARE/MEM_USAGE'].should eql('1572864')
            @host['HOST_SHARE/CPU_USAGE'].should eql('300')
            @host['HOST_SHARE/FREE_CPU'].should eql('800')
            @host['HOST_SHARE/RUNNING_VMS'].should eql('3')
            @host['TEMPLATE/CPUSPEED'].should eql('2.2GHz')
            @host['TEMPLATE/HYPERVISOR'].should eql('dummy')
            @host['TEMPLATE/TOTALMEMORY'].should eql('16777216')
        end
    end


    describe "Host using NOKOGIRI without id" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = Host.build_xml()
            
            client = MockClient.new()
            @host = Host.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end
        
        it "should get Error getting info" do
            rc = @host.info()        
            
            OpenNebula.is_error?(rc).should eql(true)
            @host.id.should eql(nil)
            @host.name.should eql(nil)
        end

        it "should enable the HOST" do
            rc = @host.enable()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should disable the HOST" do
            rc = @host.disable()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the HOST" do
            rc = @host.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

    describe "Host using REXML without id" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = Host.build_xml()
            
            client = MockClient.new()
            @host = Host.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end
        
        it "should get Error getting info" do
            rc = @host.info()
            
            OpenNebula.is_error?(rc).should eql(true)
            @host.id.should eql(nil)
            @host.name.should eql(nil)
        end

        it "should enable the HOST" do
            rc = @host.enable()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should disable the HOST" do
            rc = @host.disable()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the HOST" do
            rc = @host.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

end
