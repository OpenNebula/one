/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

//OpenNebula Self-Service customization file.
//Use tr("String") to enable text translation.
//You can use HTML and the following variables.
var $vm_count = '<span class="vm_count" />';
var $storage_count = '<span class="storage_count" />';
var $network_count = '<span class="network_count" />';



//Login logo 591x43px
var logo_big = "images/opennebula-selfservice-big.png";
//Top left logo 179x14px
var logo_small = "images/opennebula-selfservice-small.png";


////////////////////////////////////////////////////////////////
// Dashboard tab customization
////////////////////////////////////////////////////////////////

////
//Dashboard Welcome box
////
var dashboard_welcome_title = tr("Welcome to OpenNebula Self-Service");
var dashboard_welcome_image = "images/opennebula-selfservice-icon.png"
var dashboard_welcome_html = '<p>'+tr("OpenNebula Self-Service is a simplified user interface to manage OpenNebula compute, storage and network resources. It is focused on easiness and usability and features a limited set of operations directed towards end-users.")+'</p>\
<p>'+tr("Additionally, OpenNebula Self-Service allows easy customization of the interface (e.g. this text) and brings multi-language support.")+'</p>\
<p>'+tr("Have a cloudy experience!")+'</p>';

////
//Dashboard useful links box
//Array of { href: "address", text: "text" },...
////
var dashboard_links = [
    { href: "http://opennebula.org/documentation:documentation",
      text: tr("Documentation")
    },
    { href: "http://opennebula.org/support:support",
      text: tr("Support")
    },
    { href: "http://opennebula.org/community:community",
      text: tr("Community")
    }
];

////
//Dashboard right-side boxes
////
var compute_box_title = tr("Compute");
var compute_box_image = "images/server_icon.png"; //scaled to 100px width
var compute_box_html = '<p>'+tr("Compute resources are Virtual Machines attached to storage and network resources. OpenNebula Self-Service allows you to easily create, remove and manage them, including the possibility of pausing a Virtual Machine or taking a snapshot of one of their disks.")+'</p>';

var storage_box_title = tr("Storage");
var storage_box_image = "images/storage_icon.png"; //scaled to 100px width
var storage_box_html = '<p>'+tr("Storage pool is formed by several images. These images can contain from full operating systems to be used as base for compute resources, to simple data. OpenNebula Self-Service offers you the possibility to create or upload your own images.")+'</p>';

var network_box_title = tr("Network");
var network_box_image = "images/network_icon.png";
var network_box_html = '<p>'+tr("Your compute resources connectivity is performed using pre-defined virtual networks. You can create and manage these networks using OpenNebula Self-Service.")+'</p>';


///////////////////////////////////////////////////////////
//Compute tab
///////////////////////////////////////////////////////////
var compute_dashboard_image = "images/one-compute.png";
var compute_dashboard_html = '<p>' + tr("This is a list of your current compute resources. Virtual Machines use previously defined images and networks. You can easily create a new compute element by cliking \'new\' and filling-in an easy wizard.")+'</p>\
<p>'+tr("You can also manage compute resources and perform actions such as stop, resume, shutdown or cancel.")+'</p>\
<p>'+tr("Additionally, you can take a \'snapshot\' of the storage attached to these resources. They will be saved as new resources, visible from the Storage view and re-usable.")+'</p>\
<p>'+tr("There are currently")+' <b>'+$vm_count+'</b> '+
    tr("virtual machines")+'.</p>';

///////////////////////////////////////////////////////////
//Storage tab
///////////////////////////////////////////////////////////
var storage_dashboard_image = "images/one-storage.png";
var storage_dashboard_html = '<p>'+tr("The Storage view offers you an overview of your current images. Storage elements are attached to compute resources at creation time. They can also be extracted from running virtual machines by taking an snapshot.")+'</p>\
<p>'+tr("You can add new storages by clicking \'new\'. Image files will be uploaded to OpenNebula and set ready to be used.")+'</p>\
<p>'+tr("Additionally, you can run several operations on defined storages, such as defining their persistance. Persistent images can only be used by 1 virtual machine, and the changes made by it have effect on the base image. Non-persistent images are cloned before being used in a Virtual Machine, therefore changes are lost unless a snapshot is taken prior to Virtual Machine shutdown.")+'</p>\
<p>'+tr("There are currently")+' <b>'+$storage_count+'</b> '+
    tr("images")+'.</p>';

///////////////////////////////////////////////////////////
//Network tab
///////////////////////////////////////////////////////////
var network_dashboard_image = "image/one-network.png";
var network_dashboard_html = '<p>'+tr("In this view you can easily manage OpenNebula Network resources. You can add or remove virtual networks.")+'</p>\
<p>'+tr("Compute resources can be attached to these networks at creation time. Virtual machines will be provided with an IP and the correct parameters to ensure connectivity.")+'</p>\
<p>'+
    tr("There are currently")+' <b>'+$network_count+'</b> '+ 
    tr("networks")+'.</p>';