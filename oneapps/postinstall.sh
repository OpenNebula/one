#!/bin/bash

FLAVOR="#FLAVOR#"
FLA="FLAVOR"

if [ "$FLAVOR" = "#$FLA#" ]; then
    if [ -n "$1" ]; then
        FLAVOR=$1
        ROOT=$2
    fi
fi

case "$FLAVOR" in
debian)
    SUNSTONE_VIEWS_PATH="/etc/one/sunstone-views"
    SUNSTONE_SERVER="/etc/one/sunstone-server.conf"
    SUNSTONE_AUTH="/var/lib/one/.one/sunstone_auth"
    APPFLOW_AUTH="/var/lib/one/.one/appflow_auth"
    SUNSTONE_JS="/usr/share/opennebula/sunstone/public/js/sunstone.js"
    SUNSTONE_JS_NEW="/usr/share/opennebula/oneapps/public/js/sunstone.js"
    CONFIG_TAB_JS="/usr/share/opennebula/sunstone/public/js/plugins/config-tab.js"
    CONFIG_TAB_JS_NEW="/usr/share/opennebula/oneapps/public/js/plugins/config-tab.js"
    ;;

systemwide)
    SUNSTONE_VIEWS_PATH="/etc/one/sunstone-views"
    SUNSTONE_SERVER="/etc/one/sunstone-server.conf"
    SUNSTONE_AUTH="/var/lib/one/.one/sunstone_auth"
    APPFLOW_AUTH="/var/lib/one/.one/appflow_auth"
    CONFIG_TAB_JS="/usr/lib/one/sunstone/public/js/plugins/config-tab.js"
    CONFIG_TAB_JS_NEW="/usr/share/one/oneapps/public/js/plugins/config-tab.js"
    ;;

selfcontained)
    SUNSTONE_VIEWS_PATH="$ROOT/etc/sunstone-views"
    SUNSTONE_SERVER="$ROOT/etc/sunstone-server.conf"
    SUNSTONE_AUTH="$ROOT/var/.one/sunstone_auth"
    APPFLOW_AUTH="$ROOT/var/.one/appflow_auth"
    SUNSTONE_JS="$ROOT/lib/sunstone/public/js/sunstone.js"
    SUNSTONE_JS_NEW="/usr/share/one/oneapps/public/js/sunstone.js"
    CONFIG_TAB_JS="$ROOT/lib/sunstone/public/js/plugins/config-tab.js"
    CONFIG_TAB_JS_NEW="/usr/share/one/oneapps/public/js/plugins/config-tab.js"
    ;;

*)
    echo "Flavor not supported: systemwide, debian or selfcontained" 1>&2
    exit 255
    ;;

esac

VIEW_FILES="admin.yaml user.yaml"

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

function add_view() {
    for f in $VIEW_FILES; do
        add_config "$1" "$2" "$SUNSTONE_VIEWS_PATH/$f"
    done
}

function add_server() {
    add_config "$1" "$2" "$SUNSTONE_SERVER"
}


# Configure sunstone-views.yaml and sunstone-server.conf

make_backup "$SUNSTONE_VIEWS"
make_backup "$SUNSTONE_SERVER"

add_view "    apptools-appflow-dashboard:" \
"    apptools-appflow-dashboard:
        panel_tabs:
        table_columns:
        actions:"

add_view "    apptools-appflow-services:" \
"    apptools-appflow-services:
        panel_tabs:
            service_info_tab: true
            service_roles_tab: true
            service_vms_tab: true
            service_log_tab: true
        panel_tabs_actions:
            service_roles_tab:
                Role.hold: true
                Role.release: true
                Role.suspend: true
                Role.resume: true
                Role.stop: true
                Role.boot: true
                Role.reboot: true
                Role.reboot_hard: true
                Role.poweroff: true
                Role.poweroff_hard: true
                Role.shutdown: true
                Role.shutdown_hard: true
                Role.delete: true
                Role.delete_recreate: true
        table_columns:
            - 0         # Checkbox
            - 1         # ID
            - 2         # Owner
            - 3         # Group
            - 4         # Name
            - 5         # State
        actions:
            Service.refresh: true
            Service.chown: true
            Service.chgrp: true
            Service.chmod: true
            Service.shutdown: true
            Service.delete: true"

add_view "    apptools-appflow-templates:" \
"    apptools-appflow-templates:
        panel_tabs:
            service_template_info_panel: true
        table_columns:
            - 0         # Checkbox
            - 1         # ID
            - 2         # Owner
            - 3         # Group
            - 4         # Name
        actions:
            ServiceTemplate.refresh: true
            ServiceTemplate.create_dialog: true
            ServiceTemplate.instantiate: true
            ServiceTemplate.chown: true
            ServiceTemplate.chgrp: true
            ServiceTemplate.chmod: true
            ServiceTemplate.delete: true"

add_view "    apptools-appstage-dashboard:" \
"    apptools-appstage-dashboard:
        panel_tabs:
        table_columns:
        actions:"

add_view "    apptools-appstage:" \
"    apptools-appstage:
        panel_tabs:
            appstage_info_tab: true
            appstage_node_tab: true
        table_columns:
            - 0         # Checkbox
            - 1         # ID
            - 2         # Owner
            - 3         # Group
            - 4         # Name
            - 5         # Description
        actions:
            AppStage.refresh: true
            AppStage.create_dialog: true
            AppStage.update_dialog: true
            AppStage.chown: true
            AppStage.chgrp: true
            AppStage.chmod: true
            AppStage.delete: true"


add_view "apptools-appmarket-dashboard:" \
"    apptools-appmarket-dashboard:
        panel_tabs:
        table_columns:
        actions:"

add_view "apptools-appmarket-appliances:" \
"    apptools-appmarket-appliances:
        panel_tabs:
            appmarket_info_tab: true
        table_columns:
            - 0         # Checkbox
            #- 1         # ID
            - 2         # Name
            - 3         # Publisher
            - 4         # Hypervisor
            - 5         # Arch
            - 6         # Format
            #- 7         # Tags
        actions:
            AppMarket.refresh: true
            AppMarket.import: true"

add_server "^:routes:" ":routes:"

add_server "- appstage"  "    - appstage"
add_server "- appflow"   "    - appflow"
add_server "- appmarket" "    - appmarket"



# Copy sunstone_auth to appflow_auth

if [ ! -e "$APPFLOW_AUTH" ]; then
    cp -p "$SUNSTONE_AUTH" "$APPFLOW_AUTH"
fi

# Install new sunstone.js & plugins/config-tab.js
make_backup "$SUNSTONE_JS"
cp "$SUNSTONE_JS_NEW" "$SUNSTONE_JS"
make_backup "$CONFIG_TAB_JS"
cp "$CONFIG_TAB_JS_NEW" "$CONFIG_TAB_JS"

print_install_message


