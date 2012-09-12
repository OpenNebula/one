require File.expand_path(File.dirname(__FILE__) + '/spec_helper')

describe 'Validator tests' do
    before do
        @@validator = Validator::Validator.new
    end

    it "type :string" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :string
                }
            }
        }

        hash = {
            'username' => 'pepe'
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 2134
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'aa' => 2134
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :integer" do
        schema = {
            :type => :object,
            :properties => {
                'version' => {
                    :type => :integer
                }
            }
        }

        hash = {
            'version' => 43
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'version' => 'pepe'
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'aa' => 2134
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :string, :default" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :string,
                    :default => 'defpepe'
                }
            }
        }

        hash = {}

        @@validator.validate!(hash, schema).should == {'username' => 'defpepe'}

        hash = {
            'username' => 'pepe'
        }

        @@validator.validate!(hash, schema).should == hash
    end

    it "type :string, :required" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :string,
                    :required => true
                }
            }
        }

        hash = {}

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => 'pepe'
        }

        @@validator.validate!(hash, schema).should == hash
    end

    it "type :string, :enum" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :string,
                    :enum => ['juan', 'luis']
                }
            }
        }

        hash = {
            'username' => 'juan'
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 'pepe'
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :string, :format :url" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :string,
                    :format => :uri
                }
            }
        }

        hash = {
            'username' => 'http://localhost:4567'
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 'h:|)=pepe'
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :array, :items :string" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :array,
                    :items => {
                        :type => :string
                    }
                }
            }
        }

        hash = {
            'username' => ['pepe', 'luis', 'juan']
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 'h:|)=pepe'
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => ['pepe', 4343, 'juan']
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :array, :items :array" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :array,
                    :items => {
                        :type => :array,
                        :items => {
                            :type => :string
                        }
                    }
                }
            }
        }

        hash = {
            'username' => [['pepe', 'luis', 'juan']]
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 'h:|)=pepe'
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => ['pepe', '4343', 'juan']
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => ['pepe', 4343, 'juan']
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end

    it "type :object, :string" do
        schema = {
            :type => :object,
            :properties => {
                'username' => {
                    :type => :object,
                    :properties => {
                        'user' => {
                            :type => :string
                            },
                        'pass' => {
                            :type => :string
                        }

                    }
                }
            }
        }

        hash = {
            'username' => {
                'user' => 'pepe',
                'pass' => 'pepepass'
            }
        }

        @@validator.validate!(hash, schema).should == hash

        hash = {
            'username' => 'h:|)=pepe'
        }

        begin
            @@validator.validate!(hash, schema)
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => ['pepe', 4343, 'juan']
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => {
                'user' => 'pepe',
                'pass' => 343
            }
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end

        hash = {
            'username' => {
                'user' => 'pepe',
                'fad' => 343
            }
        }

        begin
            @@validator.validate!(hash, schema).should == false
        rescue Validator::ParseException
            #puts $!.message
        end
    end
end