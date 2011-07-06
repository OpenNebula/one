$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "User using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            client = MockClient.new()
            @user_pool = UserPool.new(client)
        end
        
        it "should update the USER_POOL info" do
            rc = @user_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the USER_POOL elements and get info from them" do
            rc = @user_pool.each{ |user|
                user.class.to_s.should eql("OpenNebula::User")
                if user.id == 0
                    user.name.should eql('oneadmin')
                    user['PASSWORD'].should eql('f13a1234833436f71ab846572d251c0d40391e72')
                    user['ENABLED'].should eql('1')
                elsif user.id == 1
                    user.name.should eql('dan')
                    user['PASSWORD'].should eql('d22a12348334v33f71ba846572d25250d40701e72')
                    user['ENABLED'].should eql('0')
                end
            }
        end
    end
    
    describe "User using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            client = MockClient.new()
            @user_pool = UserPool.new(client)
        end
        
        it "should update the USER_POOL info" do
            rc = @user_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the USER_POOL elements and get info from them" do
            rc = @user_pool.each{ |user|
                user.class.to_s.should eql("OpenNebula::User")
                if user.id == 0
                    user.name.should eql('oneadmin')
                    user['PASSWORD'].should eql('f13a1234833436f71ab846572d251c0d40391e72')
                    user['ENABLED'].should eql('1')
                elsif user.id == 1
                    user.name.should eql('dan')
                    user['PASSWORD'].should eql('d22a12348334v33f71ba846572d25250d40701e72')
                    user['ENABLED'].should eql('0')
                end
            }
        end
    end
end
