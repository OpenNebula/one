require 'ActionManager'
require 'ffi-rzmq'

module OpenNebula

    module DocumentServer

        # Event Manager class. Handles asynchronous events from OpenNebula
        class EventManager

            COMP = 'EVT'

            # Array containing the names of all available action methods (as symbols)
            ACTIONS = []
            # List of states that are considered failure conditions
            FAILURE_STATES = []
            # List of states to subscribe to for notifications or events
            SUBSCRIBE_STATES = []

            def initialize(cloud_auth, conf)
                @cloud_auth = cloud_auth
                @conf       = conf
                @pool       = []
                @suscriber  = ODS::EventSubscriber.default_subscriber

                # Create and register Action Manager actions
                @am = ActionManager.new(@conf[:concurrency], true)

                self.class::ACTIONS.each do |action|
                    @am.register_action(action, method(action))
                end
            end

            def start
                Log.info(COMP, 'Starting Event Manager')
                @am.start_listener
            end

            # Triggers an action through the Action Manager
            # All functions recives as first parameter the ID of the resource
            #
            # @param name [Symbol] name of the action to trigger
            # @param id [Integer] identifier of the target cluster or resource
            # @param args [Array] optional arguments passed to the action
            # @return [void]
            def trigger_action(name:, args: [])
                action_id = SecureRandom.uuid
                @am.trigger_action(name, action_id, *args)

                action_id
            rescue StandardError => e
                msg = "Error triggering action for cluster: #{e.message}"
                Log.error(COMP, msg, action_id)
                return OpenNebula::Error.new(msg, OpenNebula::Error::EINTERNAL)
            end

        end

    end

end
