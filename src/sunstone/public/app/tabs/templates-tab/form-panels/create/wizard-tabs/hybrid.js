define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./hybrid/html');
  
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
        label: Locale.tr("Availability Zone"),
        tooltip: Locale.tr("The Availability Zone in which to run the instance.")
      },
      {
        name: "BLOCKDEVICEMAPPING",
        label: Locale.tr("Block Device Mapping"),
        tooltip: Locale.tr("The block device mapping for the instance. More than one can be specified in a space-separated list. Check the –block-device-mapping option of the EC2 CLI Reference for the syntax")
      },
      {
        name: "CLIENTTOKEN",
        label: Locale.tr("Client Token"),
        tooltip: Locale.tr("Unique, case-sensitive identifier you provide to ensure idempotency of the request.")
      },
      {
        name: "EBS_OPTIMIZED",
        label: Locale.tr("EBS Optimized"),
        tooltip: Locale.tr("Obtain a better I/O throughput for VMs with EBS provisioned volumes")
      },
      {
        name: "ELASTICIP",
        label: Locale.tr("Elastic IP"),
        tooltip: Locale.tr("EC2 Elastic IP address to assign to the instance. This parameter is passed to the command ec2-associate-address -i i-0041230 elasticip.")
      },
      {
        name: "HOST",
        label: Locale.tr("OpenNebula Host"),
        tooltip: Locale.tr("Defines which OpenNebula host will use this template")
      },
      {
        name: "INSTANCETYPE",
        label: Locale.tr("Instance Type"),
        tooltip: Locale.tr("Specifies the instance type."),
        required: true
      },
      {
        name: "KEYPAIR",
        label: Locale.tr("Keypair"),
        tooltip: Locale.tr("The name of the key pair, later will be used to execute commands like ssh -i id_keypair or scp -i id_keypair")
      },
      {
        name: "LICENSEPOOL",
        label: Locale.tr("License Pool"),
        tooltip: Locale.tr("Name of the license pool.")
      },
      {
        name: "PLACEMENTGROUP",
        label: Locale.tr("Placement Group"),
        tooltip: Locale.tr("Name of the placement group.")
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
        label: Locale.tr("Security Groups"),
        tooltip: Locale.tr("Name of the security group. You can specify more than one security group (comma separated).")
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
        label: Locale.tr("Tenancy"),
        tooltip: Locale.tr("The tenancy of the instance you want to launch.")
      },
      {
        name: "USERDATA",
        label: Locale.tr("User Data"),
        tooltip: Locale.tr("Specifies Base64-encoded MIME user data to be made available to the instance(s) in this reservation.")
      }
    ],
    softlayer: [
      {
        name: "BLOCKDEVICETEMPLATE",
        label: Locale.tr("Block Device Template"),
        tooltip: Locale.tr("A global identifier for the template to be used to provision the computing instance")
      },
      {
        name: "BLOCKDEVICE",
        label: Locale.tr("Block Device Size"),
        tooltip: Locale.tr("Size of the block device size to be presented to the VM")
      },
      {
        name: "DATACENTER",
        label: Locale.tr("Datacenter"),
        tooltip: Locale.tr("Specifies which datacenter the instance is to be provisioned in")
      },
      {
        name: "DEDICATEDHOST",
        label: Locale.tr("Dedicated Host"),
        tooltip: Locale.tr("Specifies whether or not the instance must only run on hosts with instances from the same account")
      },
      {
        name: "DOMAIN",
        label: Locale.tr("Domain"),
        tooltip: Locale.tr("Domain for the computing instance"),
        required: true
      },
      {
        name: "HOSTNAME",
        label: Locale.tr("Hostname"),
        tooltip: Locale.tr("Hostname for the computing instance"),
        required: true
      },
      {
        name: "HOURLYBILLING",
        label: Locale.tr("Hourly Billing"),
        tooltip: Locale.tr("Specifies the billing type for the instance . When true the computing instance will be billed on hourly usage, otherwise it will be billed on a monthly basis"),
        required: true
      },
      {
        name: "INSTANCE_TYPE",
        label: Locale.tr("Instance Type"),
        tooltip: Locale.tr("Specifies the capacity of the VM in terms of CPU and memory. If both STARTCPUS and MAXMEMORY are used, then this parameter is disregarded"),
        required: true
      },
      {
        name: "LOCALDISK",
        label: Locale.tr("Local Disk"),
        tooltip: Locale.tr("Name of the placement group. When true the disks for the computing instance will be provisioned on the host which it runs, otherwise SAN disks will be provisioned"),
        required: true
      },
      {
        name: "MAXMEMORY",
        label: Locale.tr("Max Memory"),
        tooltip: Locale.tr("The amount of memory to allocate in megabytes")
      },
      {
        name: "NETWORKCOMPONENTSMAXSPEED",
        label: Locale.tr("Network Components Max Speed"),
        tooltip: Locale.tr("Specifies the connection speed for the instance's network components")
      },
      {
        name: "OPERATINGSYSTEM",
        label: Locale.tr("Operating System"),
        tooltip: Locale.tr("An identifier for the operating system to provision the computing instance with. A non exhaustive list of identifiers can be found here"),
        required: true
      },
      {
        name: "POSTSCRIPT",
        label: Locale.tr("Postscript"),
        tooltip: Locale.tr("Specifies the uri location of the script to be downloaded and run after installation is complete")
      },
      {
        name: "PRIVATENETWORKONLY",
        label: Locale.tr("Private Netwrok Only"),
        tooltip: Locale.tr("Specifies whether or not the instance only has access to the private network  (ie, if it is going to have a public IP interface or not)")
      },
      {
        name: "PRIMARYNETWORKVLAN",
        label: Locale.tr("Primary Network VLAN"),
        tooltip: Locale.tr("Specifies the network vlan which is to be used for the frontend interface of the computing instance")
      },
      {
        name: "PRIMARYBACKENDNETWORKVLAN",
        label: Locale.tr("Primary Backed Network VLAN"),
        tooltip: Locale.tr("Specifies the network vlan which is to be used for the backend interface of the computing instance")
      },
      {
        name: "SSHKEYS",
        label: Locale.tr("SSH Keys"),
        tooltip: Locale.tr("SSH keys to install on the computing instance upon provisioning")
      },
      {
        name: "STARTCPUS",
        label: Locale.tr("Start CPUs"),
        tooltip: Locale.tr("The number of CPU cores to allocate to the VM")
      },
      {
        name: "USERDATA",
        label: Locale.tr("User Data"),
        tooltip: Locale.tr("Arbitrary data to be made available to the computing instance")
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

    this.wizardTabId = WIZARD_TAB_ID;
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
    context.foundation('reflow', 'tab');
    that.numberOfProviders = 0;

    // close icon: removing the tab on click
    context.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var dd = $(this).closest('dd');
      var dl = $(this).closest('dl');
      var content = $(target);

      dd.remove();
      content.remove();

      if (dd.attr("class") == 'active') {
        $('a', dl.children('dd').last()).click();
      }

      $("dl#template_create_hybrid_tabs dd", context).each(function(index) {
          $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
        })
    });

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
    var ec2JSON = [];

    /* TODO Check if vCenter is defined
    if ($.isEmptyObject(vm_json["PUBLIC_CLOUD"])) {
      vm_json["PUBLIC_CLOUD"] = [];
    }*/

    if ($("[wizard_field='HYPERVISOR']:checked").val() == 'vcenter') {
      publicCloudJSON.push({
        'TYPE': 'vcenter',
        'VM_TEMPLATE': $("#vcenter_template_uuid").val()
      });
    }

    $('.provider', context).each(function() {
      var hash  = WizardFields.retrieve(this);
      if (!$.isEmptyObject(hash)) {
        var hybrid = $("input.hybridRadio:checked", this).val();
        switch (hybrid) {
          case 'ec2':
            ec2JSON.push(hash);
            break;
          case 'softlayer':
            hash["TYPE"] = hybrid.toUpperCase();
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
    if (!$.isEmptyObject(ec2JSON)) { templateJSON['EC2'] = ec2JSON; };

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

    if (templateJSON.EC2) {
      var providers = templateJSON.EC2

      if (providers instanceof Array) {
        $.each(providers, function(index, provider) {
          clickButton = clickButton || index > 0;
          that.fillProviderTab(context, provider, "ec2", clickButton);
        });
      } else if (providers instanceof Object) {
        that.fillProviderTab(context, providers, "ec2", clickButton);
      }

      delete templateJSON.EC2
    }
  }

  function _addProviderTab(provider_id, context) {
    var htmlId  = 'provider' + provider_id;

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="' + htmlId + 'Tab" class="provider wizard_internal_tab content">' +
      '<div class="row">' +
        '<div class="large-12 columns">' +
          '<label>' + Locale.tr("Hybrid Cloud") + '</label>' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="ec2" id="amazonRadio' + htmlId + '"><label for="amazonRadio' + htmlId + '">Amazon EC2</label>' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="softlayer" id="softlayerRadio' + htmlId + '"><label for="softlayerRadio' + htmlId + '">IBM Softlayer</label>' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="azure" id="azureRadio' + htmlId + '"><label for="azureRadio' + htmlId + '">Microsoft Azure</label>' +
        '</div>' +
      '</div>' +
      '<div class="row hybrid_inputs vm_param">' +
      '</div>' +
    '</div>'
    $(html_tab_content).appendTo($("#template_create_hybrid_tabs_content", context));

    var a = $("<dd>\
        <a id='provider_tab" + htmlId + "' href='#" + htmlId + "Tab'>" + Locale.tr("PROVIDER") + "</a>\
      </dd>").appendTo($("dl#template_create_hybrid_tabs", context));

    $("dl#template_create_hybrid_tabs dd", context).each(function(index) {
        $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
      })

    $("a", a).trigger("click");

    var providerSection = $('#' + htmlId + 'Tab', context);

    providerSection.on("change", "input.hybridRadio", function() {
        $(".hybrid_inputs", providerSection).html("");

        var required_str = "";
        var not_required_str = "";

        $.each(HYBRID_INPUTS[this.value], function(index, obj) {
          if (obj.required) {
            required_str += '<div class="large-6 columns">' +
              '<label>' +
                obj.label +
                '<span class="tip">' +
                  obj.tooltip +
                '</span>' +
              '</label>' +
              '<input wizard_field="' + obj.name + '" type="text" id="' + obj.name + '">' +
            '</div>'
          } else {
            not_required_str += '<div class="large-6 columns">' +
              '<label>' +
                obj.label +
                '<span class="tip">' +
                  obj.tooltip +
                '</span>' +
              '</label>' +
              '<input wizard_field="' + obj.name + '" type="text" id="' + obj.name + '">' +
            '</div>'
          }
        });

        $(".hybrid_inputs", providerSection).append(
          required_str +
          '<br><hr><br>' +
          not_required_str)

        Tips.setup($(".hybrid_inputs", providerSection));
      })
  }

  function _fillProviderTab(context, provider, providerType, clickButton) {
    var that = this;
    if (providerType == "vcenter") {
      $("#vcenter_template_uuid").val(provider["VM_TEMPLATE"])
    } else {
      if (clickButton) {
        $("#tf_btn_hybrid", context).trigger("click");
      }

      var providerContext = $(".provider", context).last();
      $("input.hybridRadio[value='" + providerType + "']", providerContext).trigger("click");
      WizardFields.fill(providerContext, provider);
    }
  }
});
