require_relative 'shared/spec_helper'

RSpec.describe ODS::StateMachine do
    let(:klass) do
        Class.new do
            include ODS::StateMachine

            state_machine(
                :initial => :PENDING,
                :transitions => {
                    :PENDING => [:RUNNING, :WARNING],
                    :RUNNING => [:DONE, :RUNNING_FAILURE],
                    :ANY => [:ERROR]
                }
            )
        end
    end

    it 'initializes state, validates transitions and classifies failures' do
        object = klass.new
        expect(object.state).to eq(:PENDING)
        object.state = :RUNNING
        expect(object).to be_running
        object.state = :RUNNING_FAILURE
        expect(object).to be_failed
        expect(object.state_str).to eq('RUNNING_FAILURE')
        object.state = :ERROR
        expect(object).to be_failed
        expect(klass.failed_states).to contain_exactly(:RUNNING_FAILURE)
        expect(klass.states).to include(:PENDING, :RUNNING, :WARNING, :DONE, :ERROR)

        warning = klass.new
        warning.state = :WARNING
        expect(warning).to be_warning
    end

    it 'rejects invalid state graphs and invalid transitions' do
        expect do
            Class.new do
                include ODS::StateMachine

                state_machine(:initial => :MISSING, :transitions => { :READY => [:DONE] })
            end
        end.to raise_error(ArgumentError, /not a valid state/)

        object = klass.new
        expect { object.state = :DONE }.to raise_error(ArgumentError, /Invalid transition/)
    end

    it 'reads and writes an external state path as normalized values' do
        external = Class.new do
            include ODS::StateMachine

            attr_reader :body

            state_machine(:initial => :PENDING, :transitions => { :PENDING => [:RUNNING] })

            def initialize
                @body = { :state => 'PENDING' }
                super(:state_path => [:@body, :state])
            end
        end.new

        external.state = :RUNNING
        expect(external.body[:state]).to eq('RUNNING')
        expect(external.state).to eq(:RUNNING)
    end
end
