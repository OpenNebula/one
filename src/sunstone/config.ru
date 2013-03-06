
# If you are using self contained installation set this variable to the
# install location
#ENV['ONE_LOCATION']='/path/to/OpenNebula/install'

WITH_RACKUP=true

$: << '.'
require 'sunstone-server'

run Sinatra::Application

