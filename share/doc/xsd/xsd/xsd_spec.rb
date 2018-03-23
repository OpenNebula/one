
require 'init_functionality'
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
describe "XSD for xml documents test" do
    
#---------------------------------------------------------------------------
  # TESTS
  #---------------------------------------------------------------------------
  it "Group" do
        Dir.chdir("./spec/functionality/xsd") {
            `./test.sh`
            out = File.read("output.log")
            error = ""
            if out.include? "error"
                out.lines.select{|e|
                    if e.include?('error')
                        error = "#{error} #{e}"
                    end
                }
                `rm output.log`
                `rm -r samples`
                fail error
            end
            `rm output.log`
            `rm -r samples`
        }
    end
end
