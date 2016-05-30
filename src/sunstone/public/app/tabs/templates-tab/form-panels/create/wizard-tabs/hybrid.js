/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

define(function(require) {
  /*
    DEPENDENCIES
   */

//  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./hybrid/html');
  var EC2HTML = require('hbs!./hybrid/ec2');
  var AzureHTML = require('hbs!./hybrid/azure');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./hybrid/wizardTabId');
  var HYBRID_INPUTS = {
    ec2 : [
      {
        name: "AKI",
        label: Locale.tr("AKI"),
        tooltip: Locale.tr("The ID of the kernel with which to launch the instance.")
      },
      {
        name: "AMI",
        label: Locale.tr("AMI"),
        tooltip: Locale.tr("Unique ID of a machine image, returned by a call to ec2-describe-images."),
        required: true
      },
      {
        name: "AVAILABILITYZONE",
        label: Locale.tr("Availability zone")
      },
      {
        name: "BLOCKDEVICEMAPPING",
        label: Locale.tr("Block device mapping"),
        tooltip: Locale.tr("The block device mapping for the instance. More than one can be specified in a space-separated list. Check the –block-device-mapping option of the EC2 CLI Reference for the syntax")
      },
      {
        name: "CLIENTTOKEN",
        label: Locale.tr("Client token"),
        tooltip: Locale.tr("Unique, case-sensitive identifier you provide to ensure idempotency of the request.")
      },
      {
        name: "EBS_OPTIMIZED",
        label: Locale.tr("EBS optimized"),
        tooltip: Locale.tr("Obtain a better I/O throughput for VMs with EBS provisioned volumes")
      },
      {
        name: "ELASTICIP",
        label: Locale.tr("Elastic IP address"),
        tooltip: Locale.tr("This parameter is passed to the command ec2-associate-address -i i-0041230 elasticip.")
      },
      {
        name: "HOST",
        label: Locale.tr("OpenNebula Host"),
        tooltip: Locale.tr("Defines which OpenNebula host will use this template")
      },
      {
        name: "INSTANCETYPE",
        label: Locale.tr("Instance type"),
        required: true
      },
      {
        name: "KEYPAIR",
        label: Locale.tr("Keypair name"),
        tooltip: Locale.tr("The name of the key pair, later will be used to execute commands like ssh -i id_keypair or scp -i id_keypair")
      },
      {
        name: "LICENSEPOOL",
        label: Locale.tr("License pool name")
      },
      {
        name: "PLACEMENTGROUP",
        label: Locale.tr("Placement group name")
      },
      {
        name: "PRIVATEIP",
        label: Locale.tr("Private IP"),
        tooltip: Locale.tr("If you’re using Amazon Virtual Private Cloud, you can optionally use this parameter to assign the instance a specific available IP address from the subnet.")
      },
      {
        name: "RAMDISK",
        label: Locale.tr("Ramdisk"),
        tooltip: Locale.tr("The ID of the RAM disk to select.")
      },
      {
        name: "SECURITYGROUPS",
        label: Locale.tr("Security group names"),
        tooltip: Locale.tr("You can specify more than one security group (comma separated).")
      },
      {
        name: "SECURITYGROUPIDS",
        label: Locale.tr("Security group IDs"),
        tooltip: Locale.tr("You can specify more than one security group (comma separated).")
      },
      {
        name: "SUBNETID",
        label: Locale.tr("Subnet ID"),
        tooltip: Locale.tr("If you’re using Amazon Virtual Private Cloud, this specifies the ID of the subnet you want to launch the instance into. This parameter is also passed to the command ec2-associate-address -i i-0041230 -a elasticip.")
      },
      {
        name: "TAGS",
        label: Locale.tr("Tags"),
        tooltip: Locale.tr("Key and optional value of the tag, separated by an equals sign ( = ).You can specify more than one tag (comma separated).")
      },
      {
        name: "TENANCY",
        label: Locale.tr("Tenancy")
      },
      {
        name: "USERDATA",
        label: Locale.tr("User data"),
        tooltip: Locale.tr("Specifies Base64-encoded MIME user data to be made available to the instance(s) in this reservation.")
      }
    ],
    azure: [
      {
        name: "AFFINITY_GROUP",
        label: Locale.tr("Affinity Group"),
        tooltip: Locale.tr("Affinity groups allow you to group your Azure services to optimize performance. All services and VMs within an affinity group will be located in the same region")
      },
      {
        name: "AVAILABILITY_SET",
        label: Locale.tr("Availability Set"),
        tooltip: Locale.tr("Name of the availability set to which this VM will belong")
      },
      {
        name: "CLOUD_SERVICE",
        label: Locale.tr("Cloud Service"),
        tooltip: Locale.tr("Specifies the name of the cloud service where this VM will be linked. Defaults to 'OpennebulaDefaultCloudServiceName'")
      },
      {
        name: "IMAGE",
        label: Locale.tr("Image"),
        tooltip: Locale.tr("Specifies the base OS of the VM."),
        required: true
      },
      {
        name: "INSTANCE_TYPE",
        label: Locale.tr("Instance Type"),
        tooltip: Locale.tr("Specifies the capacity of the VM in terms of CPU and memory"),
        required: true
      },
      {
        name: "LOCATION",
        label: Locale.tr("Location"),
        tooltip: Locale.tr("Azure datacenter where the VM will be sent. See /etc/one/az_driver.conf for possible values (under region_name)"),
        required: true
      },
      {
        name: "SSHPORT",
        label: Locale.tr("SSH Port"),
        tooltip: Locale.tr("Port where the VMs ssh server will listen on")
      },
      {
        name: "STORAGE_ACCOUNT",
        label: Locale.tr("Storage Account"),
        tooltip: Locale.tr("Specify the storage account where this VM will belong")
      },
      {
        name: "SUBNET",
        label: Locale.tr("Subnet"),
        tooltip: Locale.tr("Name of the particular Subnet where this VM will be connected to")
      },
      {
        name: "TCP_ENDPOINTS",
        label: Locale.tr("TCP Endpoints"),
        tooltip: Locale.tr("Comma-separated list of TCP ports to be accesible from the public internet to this VM")
      },
      {
        name: "VIRTUAL_NETWORK_NAME",
        label: Locale.tr("Virtual Network Name"),
        tooltip: Locale.tr("Name of the virtual network to which this VM will be connected")
      },
      {
        name: "VM_USER",
        label: Locale.tr("VM User"),
        tooltip: Locale.tr("If the selected IMAGE is prepared for Azure provisioning, a username can be specified here to access the VM once booted"),
        required: true
      },
      {
        name: "VM_PASSWORD",
        label: Locale.tr("VM Password"),
        tooltip: Locale.tr("Password for VM_USER"),
        required: true
      },
      {
        name: "WIN_RM",
        label: Locale.tr("Win RM"),
        tooltip: Locale.tr("Comma-separated list of possible protocols to access this Windows VM")
      }
    ]
  }

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('hybrid')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-cloud';
    this.title = Locale.tr("Hybrid");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.addProviderTab = _addProviderTab;
  WizardTab.prototype.fillProviderTab = _fillProviderTab;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, 'tabs');
    that.numberOfProviders = 0;

    context.on("click", "#tf_btn_hybrid", function() {
      that.addProviderTab(that.numberOfProviders, context);
      that.numberOfProviders++;
      return false;
    });

    $("#tf_btn_hybrid", context).trigger("click");
  }

  function _retrieve(context) {
    var templateJSON = {};
    var publicCloudJSON = [];

    $('.provider', context).each(function() {
      var hash  = WizardFields.retrieve(this);
      if (!$.isEmptyObject(hash)) {
        var hybrid = $("input.hybridRadio:checked", this).val();
        switch (hybrid) {
          case 'ec2':
            hash["TYPE"] = "ec2";
            publicCloudJSON.push(hash);
            break;
          case 'azure':
            hash["TYPE"] = hybrid.toUpperCase();
            publicCloudJSON.push(hash);
            break;
        }
      };
    });

    if (!$.isEmptyObject(publicCloudJSON)) { templateJSON['PUBLIC_CLOUD'] = publicCloudJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var clickButton = false;
    if (templateJSON.PUBLIC_CLOUD) {
      var providers = templateJSON.PUBLIC_CLOUD

      if (providers instanceof Array) {
        $.each(providers, function(index, provider) {
          clickButton = index > 0;
          that.fillProviderTab(context, provider, provider.TYPE.toLowerCase(), clickButton);
        });
      } else if (providers instanceof Object) {
        that.fillProviderTab(context, providers, providers.TYPE.toLowerCase(), clickButton);
        clickButton = true;
      }

      delete templateJSON.PUBLIC_CLOUD
    }
  }

  function _addProviderTab(provider_id, context) {
    var htmlId  = 'provider' + provider_id;

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="' + htmlId + 'Tab" class="provider wizard_internal_tab tabs-panel">' +
      '<div class="row">' +
        '<div class="large-12 columns">' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="ec2" id="amazonRadio' + htmlId + '"><label for="amazonRadio' + htmlId + '">Amazon EC2</label>' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="azure" id="azureRadio' + htmlId + '"><label for="azureRadio' + htmlId + '">Microsoft Azure</label>' +
        '</div>' +
      '</div>' +
      '<div class="row hybrid_inputs vm_param">' +
      '</div>' +
    '</div>'
    $(html_tab_content).appendTo($("#template_create_hybrid_tabs_content", context));

    var a = $("<li class='tabs-title'>\
        <a id='provider_tab" + htmlId + "' href='#" + htmlId + "Tab'>" + Locale.tr("PROVIDER") + "</a>\
      </li>").appendTo($("ul#template_create_hybrid_tabs", context));

    $("ul#template_create_hybrid_tabs li", context).each(function(index) {
        $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
      })

    Foundation.reInit($("ul#template_create_hybrid_tabs", context));

    $("a", a).trigger("click");

    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest('li');
      var ul = $(this).closest('ul');
      var content = $(target);

      li.remove();
      content.remove();

      if (li.hasClass('is-active')) {
        $('a', ul.children('li').last()).click();
      }

      $("ul#template_create_hybrid_tabs li", context).each(function(index) {
          $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
        })
    });

    var providerSection = $('#' + htmlId + 'Tab', context);

    providerSection.on("change", "input.hybridRadio", function() {
      $(".hybrid_inputs", providerSection).html("");

      if (this.value == "ec2"){
        $(".hybrid_inputs", providerSection).append(EC2HTML());
      } else {
        $(".hybrid_inputs", providerSection).append(AzureHTML());
      }

      Tips.setup(providerSection);
    })
  }

  function _fillProviderTab(context, provider, providerType, clickButton) {
    var that = this;
    if (providerType == "vcenter") {
      return false;
    }

    if (clickButton) {
      $("#tf_btn_hybrid", context).trigger("click");
    }

    var providerContext = $(".provider", context).last();
    $("input.hybridRadio[value='" + providerType + "']", providerContext).trigger("click");
    WizardFields.fill(providerContext, provider);
  }
});
