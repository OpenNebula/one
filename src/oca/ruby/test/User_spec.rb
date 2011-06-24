$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "User using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = User.build_xml(3)
            
            client = MockClient.new()
            @user = User.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should allocate the new USER" do
            @user.allocate(nil,nil)

            @user.id.should eql(3)
        end
        
        it "should update the USER info" do
            @user.info()
            
            @user.id.should eql(3)
            @user.name.should eql('dan')
        end
        
        it "should delete the USER" do
            rc = @user.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @user['ID'].should eql('3')
            @user['NAME'].should eql('dan')
            @user['PASSWORD'].should eql('d22a12348334v33f71ba846572d25250d40701e72')
            @user['ENABLED'].should eql('0')
        end
    end

    describe "User using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = User.build_xml(3)
            
            client = MockClient.new()
            @user = User.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should allocate the new USER" do
            @user.allocate(nil,nil)

            @user.id.should eql(3)
        end

        it "should update the USER info" do
            @user.info()

            @user.id.should eql(3)
            @user.name.should eql('dan')
        end
        
        it "should delete the USER" do
            rc = @user.delete()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @user['ID'].should eql('3')
            @user['NAME'].should eql('dan')
            @user['PASSWORD'].should eql('d22a12348334v33f71ba846572d25250d40701e72')
            @user['ENABLED'].should eql('0')
        end
    end


    describe "User using NOKOGIRI without id" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = User.build_xml()
            
            client = MockClient.new()
            @user = User.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should get Error getting info" do
            rc = @user.info()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the USER" do
            rc = @user.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

    describe "User using REXML without id" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = User.build_xml()
            
            client = MockClient.new()
            @user = User.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end
        
        it "should get Error getting info" do
            rc = @user.info()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the USER" do
            rc = @user.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

end
