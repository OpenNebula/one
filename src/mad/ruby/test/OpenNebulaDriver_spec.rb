
$: << '..'

require 'OpenNebulaDriver'
require 'test/MonkeyPatcher'

def create_driver(concurrecy, threaded, retries, directory, local_actions)
    OpenNebulaDriver.new(directory,
        :concurrency => concurrecy,
        :threaded => threaded,
        :retries => retries,
        :local_actions => local_actions)
end

local_action_tests=[
    ['', {}],
    ['poll', {'POLL' => nil}],
    ['poll,migrate', {'POLL' => nil, 'MIGRATE' => nil}],
    ['deploy,shutdown,poll=poll_ganglia, cancel ',
        {"POLL"=>"poll_ganglia", "DEPLOY"=>nil, "SHUTDOWN"=>nil,
            "CANCEL"=>nil}]
]

# modify read configuration to get config file from fixtures dir
class OpenNebulaDriver
    alias :read_configuration_old :read_configuration

    def read_configuration
        old_one_location=ENV['ONE_LOCATION']
        ENV['ONE_LOCATION']=File.join(ENV['PWD'], 'fixtures')
        result=read_configuration_old
        ENV['ONE_LOCATION']=old_one_location
        result
    end
end

def fake_execution(stdout, stderr)
    [StringIO.new(''), StringIO.new(stdout), StringIO.new(stderr)]
end

describe OpenNebulaDriver do
    before(:all) do
        @concurrecy=1
        @threaded=false
        @retries=0
        @directory='vmm/dummy'
        @local_actions={
            'POLL' => 'local_poll',
            'MIGRATE' => nil
        }

        @create_params=[@concurrecy, @threaded, @retries, @directory,
            @local_actions]
    end

    before(:each) do
        ENV['ONE_LOCATION']=nil
    end

    it 'should parse local actions' do
        local_action_tests.each do |test|
            OpenNebulaDriver.parse_actions_list(test[0]).should == test[1]
        end
    end

    it 'should get correct paths' do
        driver=create_driver(*@create_params)

        driver.local_scripts_base_path.should == '/var/lib/one/remotes'
        driver.local_scripts_path.should == '/var/lib/one/remotes/vmm/dummy'
        driver.remote_scripts_base_path.should == '/var/tmp/one'
        driver.remote_scripts_path.should == '/var/tmp/one/vmm/dummy'

        ENV['ONE_LOCATION']='/one'

        driver=create_driver(*@create_params)

        driver.local_scripts_base_path.should == '/one/var/remotes'
        driver.local_scripts_path.should == '/one/var/remotes/vmm/dummy'
        driver.remote_scripts_base_path.should == '/var/tmp/one'
        driver.remote_scripts_path.should == '/var/tmp/one/vmm/dummy'
    end

    it 'should distinguish local and remote actions' do
        driver=create_driver(*@create_params)

        driver.action_is_local?(:deploy).should == false
        driver.action_is_local?('SHUTDOWN').should == false
        driver.action_is_local?(:migrate).should == true
        driver.action_is_local?('migrate').should == true
        driver.action_is_local?(:MIGRATE).should == true
        driver.action_is_local?('MIGRATE').should == true
    end

    it 'should call correct executable' do
        driver=create_driver(*@create_params)

        driver.action_command_line(:deploy, 'parameter').should ==
            '/var/tmp/one/vmm/dummy/deploy parameter'
        driver.action_command_line(:poll, 'parameter').should ==
            '/var/lib/one/remotes/vmm/dummy/local_poll parameter'
        driver.action_command_line(:migrate, 'parameter').should ==
            '/var/lib/one/remotes/vmm/dummy/migrate parameter'
        driver.action_command_line(:test, 'parameter', 'testscr').should ==
            '/var/tmp/one/vmm/dummy/testscr parameter'
    end

    it 'should correctly send messages' do
        result=""
        driver=create_driver(*@create_params)

        MonkeyPatcher.patch do
            patch_class(IO, :puts) do |*args|
                result=args
            end

            driver.send_message('action', 'SUCCESS', 15, 'some info')
        end

        result[0].should == "action SUCCESS 15 some info"
    end

    it 'should select remote or local execution correctly' do
        local_action=[]
        remotes_action=[]

        driver=create_driver(*@create_params)

        MonkeyPatcher.patch do
            patch_class(OpenNebulaDriver, :local_action) do |*args|
                local_action=args
            end

            patch_class(OpenNebulaDriver, :remotes_action) do |*args|
                remotes_action=args
            end

            driver.do_action('some parameters', 15, 'localhost', :poll)
            driver.do_action('some parameters', 15, 'localhost', :deploy,
                :script_name => 'deploy_script')
        end

        local_action.should == [
            "/var/lib/one/remotes/vmm/dummy/local_poll some parameters 15"<<
                " localhost",
            15,
            :poll]

        remotes_action.should == ["/var/tmp/one/vmm/dummy/deploy_script"<<
                " some parameters 15 localhost",
            15,
            "localhost",
            :deploy,
            "/var/tmp/one",
            nil]
    end

    it 'should execute remote actions' do
        result=[] # here will be the parameters to send_message
        time=0 # this will count the executions of SSHCommand


        driver=create_driver(*@create_params)

        MonkeyPatcher.patch do
            # patch send_message
            patch_class(IO, :puts) do |*args|
                result<<args[0]
            end

            patch_class(LocalCommand, :execute) do
                fake_execution('command info', 'ExitCode: 0')
            end

            patch_class(SSHCommand, :execute) do
                time+=1
                case time
                when 1 # Everything goes ok (Test 1)
                    fake_execution('command info', 'ExitCode: 0')
                when 2 # Command fails (Test 2)
                    fake_execution('command info', 'ExitCode: 255')
                when 3 # File is not there (Test 3)
                    fake_execution('command info', 'ExitCode: 42')
                when 4 # Command works after a good copy (Test 3)
                    fake_execution('command info', 'ExitCode: 0')
                else
                    fake_execution('command info', 'ExitCode: 0')
                end
            end

            # Time 1
            driver.remotes_action('command', 0, 'localhost', :DEPLOY, '/')
            #puts time

            # Time 2
            driver.remotes_action('command', 0, 'localhost', :DEPLOY, '/')
            #puts time

            # Time 3
            driver.remotes_action('command', 0, 'localhost', :DEPLOY, '/')
            #puts time

        end

        #pp result

=begin
        result.should == [
            # 1 - Everything ok
            "LOG I 0 ExitCode: 0",
            "DEPLOY SUCCESS 0 command info",
            # 2 - Command fails
            "LOG I 0 Command execution fail: 'if [ -x \"command\" ]; then command; else                              exit 42; fi'",
            "LOG I 0 ExitCode: 255",
            "DEPLOY FAILURE 0 -",
            # 3 - File is not there, update files
            "LOG I 0 Command execution fail: 'if [ -x \"command\" ]; then command; else                              exit 42; fi'",
            "LOG I 0 ExitCode: 42",
            "LOG I 0 Remote worker node files not found",
            "LOG I 0 Updating remotes",
            "LOG I 0 ExitCode: 0",
            # 4 - Good command execution
            "LOG I 0 ExitCode: 0",
            "DEPLOY SUCCESS 0 command info"
        ]
=end
        result.should == [
            # 1 - Everything ok
            "LOG I 0 ExitCode: 0",
            "DEPLOY SUCCESS 0 command info",
            # 2 - Command fails
            "LOG I 0 Command execution fail: 'if [ -x \"command\" ]; then command; else                              exit 42; fi'",
            "LOG I 0 ExitCode: 255",
            "DEPLOY FAILURE 0 -",
            # 3 - File is not there, update files
            "LOG I 0 Command execution fail: 'if [ -x \"command\" ]; then command; else                              exit 42; fi'",
            # 4 - Good command execution
            "LOG I 0 ExitCode: 42",
            "DEPLOY FAILURE 0 -"]

    end

    it 'should execute local actions' do
        result=[] # here will be the parameters to send_message
        time=0 # this will count the executions of LocalCommand

        driver=create_driver(*@create_params)

        MonkeyPatcher.patch do
            # patch send_message
            patch_class(IO, :puts) do |*args|
                result<<args[0]
            end

            patch_class(LocalCommand, :execute) do
                time+=1
                case time
                when 1 # Everything goes ok (Test 1)
                    fake_execution('command info', 'ExitCode: 0')
                when 2 # Command fails (Test 2)
                    fake_execution('', '
ERROR MESSAGE --8<------
the error message
ERROR MESSAGE ------>8--
ExitCode: 255')
                else
                    puts "should not reach here"
                    fake_execution('command info', 'ExitCode: 0')
                end
            end

            # Test 1 - OK
            driver.local_action('command', 0, :DEPLOY)

            # Test 2 - Error
            driver.local_action('command', 0, :DEPLOY)

        end

        result.should == [
            "LOG I 0 ExitCode: 0", "DEPLOY SUCCESS 0 command info",
            "LOG I 0 Command execution fail: command",
            "LOG E 0 the error message",
            "LOG I 0 ExitCode: 255", "DEPLOY FAILURE 0 the error message"
        ]
    end

    it "should correctly parse log lines" do
        tests=[
            [
                "ERROR MESSAGE --8<------\nerror message\n"<<
                    "ERROR MESSAGE ------>8--\n",
                ['LOG', 'E', 0, 'error message']
            ],
            ['ERROR: error message', ['LOG', 'E', 0, 'error message']],
            ['DEBUG: debug message', ['LOG', 'D', 0, 'debug message']],
            ['INFO: info message', ['LOG', 'I', 0, 'info message']],
            ['info message', ['LOG', 'I', 0, 'info message']]
        ]

        driver=create_driver(*@create_params)
        result=''

        MonkeyPatcher.patch do
            patch_class(OpenNebulaDriver, :send_message) do |*args|
                result=args
            end

            tests.each do |test|
                driver.log(0, test[0])
                result.should == test[1]
            end
        end
    end

end

