#!/bin/bash

FLAVOR="#FLAVOR#"

case "$FLAVOR" in
debian)
    SUNSTONE_PLUGINS=/etc/one/sunstone-plugins.yaml
    SUNSTONE_SERVER=/etc/one/sunstone-server.conf
    OPENNEBULA_JS=/usr/share/opennebula/sunstone/public/js/opennebula.js
    OPENNEBULA_JS_NEW=/usr/share/opennebula/oneapps/public/js/opennebula.js
    SUNSTONE_AUTH="/var/lib/one/.one/sunstone_auth"
    APPFLOW_AUTH="/var/lib/one/.one/appflow_auth"
    ;;

*)
    SUNSTONE_PLUGINS=/etc/one/sunstone-plugins.yaml
    SUNSTONE_SERVER=/etc/one/sunstone-server.conf
    OPENNEBULA_JS=/usr/lib/one/sunstone/public/js/opennebula.js
    OPENNEBULA_JS_NEW=/usr/share/one/oneapps/public/js/opennebula.js
    SUNSTONE_AUTH="/var/lib/one/.one/sunstone_auth"
    APPFLOW_AUTH="/var/lib/one/.one/appflow_auth"
    ;;
esac

function print_install_message() {
cat <<EOT

OpenNebula Apps needs the folowing dependencies to run correctly:

  * OpenNebula

  * MongoDB. This database is needed for AppMarket. To install it
    you can follow the instructions at
        http://docs.mongodb.org/manual/installation/

  * ruby and rubygems installed. This should be already installed
    if you have already OpenNebula

  * bundler. Needed for both AppFlow and AppMarket. To install it
    you can issue:
        # gem install bundler

  * Required gems. To install the gems needed by AppFlow and
    AppMarket do this:
        # cd /usr/lib/one/ruby/oneapps/flow && bundle install
        # cd /usr/lib/one/ruby/oneapps/market && bundle install

EOT
}

function make_backup() {
    file=$1
    backup="$1.$(date '+%s')"

    if [ -f "$file" ]; then
        cp "$file" "$backup"
    fi
}

function add_config() {
    name=$1
    text=$2
    config_file=$3

    ! grep -q -- "$name" $config_file && echo "$text" >> $config_file
}

function add_plugin() {
    add_config "$1" "$2" "$SUNSTONE_PLUGINS"
}

function add_server() {
    add_config "$1" "$2" "$SUNSTONE_SERVER"
}


# Configure sunstone-plugins.yaml and sunstone-server.conf

make_backup "$SUNSTONE_PLUGINS"
make_backup "$SUNSTONE_SERVER"

add_plugin "apptools.appstage-dashboard.js" \
"- user-plugins/apptools.appstage-dashboard.js:
    :user:
    :group:
    :ALL: true"

add_plugin "apptools.appstage.js" \
"- user-plugins/apptools.appstage.js:
    :user:
    :group:
    :ALL: true"

add_plugin "apptools.appflow-dashboard.js" \
"- user-plugins/apptools.appflow-dashboard.js:
    :group:
    :ALL: true
    :user:"

add_plugin "apptools.appflow.templates.js" \
"- user-plugins/apptools.appflow.templates.js:
    :group:
    :ALL: true
    :user:"

add_plugin "apptools.appflow.services.js" \
"- user-plugins/apptools.appflow.services.js:
    :group:
    :ALL: true
    :user:"

add_plugin "apptools.appmarket-dashboard.js" \
"- user-plugins/apptools.appmarket-dashboard.js:
    :group:
    :ALL: true
    :user:"

add_plugin "apptools.appmarket.appliances.js" \
"- user-plugins/apptools.appmarket.appliances.js:
    :group:
    :ALL: true
    :user:"

add_server "^:routes:" ":routes:"

add_server "- appstage"  "    - appstage"
add_server "- appflow"   "    - appflow"
add_server "- appmarket" "    - appmarket"


# Install new opennebula.js

make_backup "$OPENNEBULA_JS"
cp "$OPENNEBULA_JS_NEW" "$OPENNEBULA_JS"


# Copy sunstone_auth to appflow_auth

if [ ! -e "$APPFLOW_AUTH" ]; then
    cp -p "$SUNSTONE_AUTH" "$APPFLOW_AUTH"
fi


print_install_message


