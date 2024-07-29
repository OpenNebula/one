/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

    var Notifier = require("utils/notifier");

    /*
        CONSTRUCTOR
    */

    return {
        'setupVMTemplate': _setupVMTemplate,
        'setupAttachDisk': _setupAttachDisk,
    };
 
    /*
        FUNCTIONS
    */

    /**
     * Convert first letter to upper case
     * @param {string} string
     */
    function capitalize (string) {
        return string[0].toUpperCase() + string.slice(1)
    }

    /**
     * Function to set an error with the iothread attribute of the given disk in the VMTemplate context.
     * @param {string} diskId Id of the disk which has the wrong value of iothreads.
     * @param {string} diskType Type of the disk which the wrong value ofiothreads.
     */
    function _setErrorDiskVMTemplate (diskId, diskType) {
        $('div[diskid="' + diskId + '"] div.' + diskType + ' input[name="IOTHREAD"]').addClass('is-invalid-input');
        $('div[diskid="' + diskId + '"] div.' + diskType + ' label[for="IOTHREAD"]').addClass('is-invalid-label');
    }

    /**
     * Function to unset an error with the iothread attribute of the given disk in the VMTemplate context.
     * @param {string} diskId Id of the disk which has the wrong value of iothreads.
     * @param {string} diskType Type of the disk which the wrong value ofiothreads.
     */
    function _unsetErrorDiskVMTemplate (diskId, diskType) {
        $('div[diskid="' + diskId + '"] div.' + diskType + ' input[name="IOTHREAD"]').removeClass('is-invalid-input');
        $('div[diskid="' + diskId + '"] div.' + diskType + ' label[for="IOTHREAD"]').removeClass('is-invalid-label');
    }

    /**
     * Function to set an error with the iothreads attribute on the features section in the VMTemplate context.
     */
    function _setErrorFeaturesIothreads () {
        $('#tabs-bootos input[wizard_field="IOTHREADS"]').addClass('is-invalid-input');
        $('#tabs-bootos label.features_iothreads').addClass('is-invalid-label');
    }

    /**
     * Function to unset an error with the iothreads attribute on the features section in the VMTemplate context.
     */
    function _unsetErrorFeaturesIothreads () {
        $('#tabs-bootos input[wizard_field="IOTHREADS"]').removeClass('is-invalid-input');
        $('#tabs-bootos label.features_iothreads').removeClass('is-invalid-label');
    }

    /**
     * Function to read the actual value from OS & CPU -> Features -> Iothreads
     * If it's not configured iothreads = 0;
     * @param {JSON} templateJSON Current VM template
     * @returns Max iothread configurable value.
     */
    function _getMaxIothreads (templateJSON) {
        var iothreads = 0;
        if (templateJSON &&
        templateJSON.FEATURES &&
        templateJSON.FEATURES.IOTHREADS){
            iothreads = parseInt(templateJSON.FEATURES.IOTHREADS, 10);
        }

        return iothreads;
    }

    /**
     * Function to take all disks from the template.
     * @param {JSON} templateJSON
     * @returns JSON with all the VM disks.
     */
    function _getDisks (templateJSON) {
        var disks = templateJSON.DISK || [];
        if (templateJSON && templateJSON.DISK && !templateJSON.DISK instanceof Array){
            disks = [templateJSON.DISK]
        }

        return disks;
    }

    /**
     * Validate if all disks have correctly set an iothread value
     * between 0 and iothreads-1.
     * @param {int} iothreads Maximun number of iothreads.
     * @param {Array} disks Array with disks templates for this VM template.
     * @returns Array with disks templates with errors in IOTHREAD.
     */
    function _checkDisksVMTemplate (iothreads, disks) {
        var disksWithError = [];
        disks.forEach(function (element, index) {
            var diskId = index + 1;
            var diskType;
            if (element && element.IOTHREAD && (element.IOTHREAD >= iothreads || element.IOTHREAD < 0)){
                disksWithError.push(index);
                _setErrorDiskVMTemplate(diskId.toString(10), diskType);
            }
            else{
                _unsetErrorDiskVMTemplate(diskId.toString(10), diskType);
            }
        });

        return disksWithError;
    }

    /**
     * Function to notify the error with the iothreads value.
     * @param {int} iothreads Maximum iothreads value.
     * @param {Array} disks Disks with errors on the iothreads value.
     */
    function _notifyError (iothreads, disks) {
        if (iothreads === 0){
            _setErrorFeaturesIothreads();
            Notifier.notifyError("Maximum IOTHREADS value must be configured, please proceed to OS & CPU -> Features");
        }
        else{
            _unsetErrorFeaturesIothreads();
            var error = "Disk IOTHREAD id must be between 0 and " + (iothreads-1).toString(10) + " (maximum number of IOTHREADS configured - 1). Please check: ";
            disks.forEach(function (id){
                error += "Disk" + id.toString(10);
                if (id != disks[disks.length-1]) error += ", ";
            });
            error += ".";
            Notifier.notifyError(error);
        }
    }

    /**
     * Function to verify the values of the iothreads on the VMTemplate.
     * @param {JSON} templateJSON Current VM template
     * @returns True if everything goes well, false if there is an error.
     */
    function _setupVMTemplate (templateJSON, action, create_title, update_title) {
        var iothreads = _getMaxIothreads(templateJSON);
        var disks = _getDisks(templateJSON);
        var errorDisks = _checkDisksVMTemplate(iothreads, disks);
        
        if (errorDisks.length > 0){
            _notifyError(iothreads, errorDisks);
            var button = $('#templates-tabsubmit_button > button');
            button.removeAttr('disabled');
            button.text(capitalize(action));
            var header = $('span.sunstone-form-title');
            if (action == "create")
                header.text(create_title);
            else
                header.text(update_title);
            return false;
        }

        return true;
    }

    /**
     * Function to block the Iothread id input on the Attach Disk Context.
     * @param {JSON} templateJSON Current VM template
     */
    function _setupAttachDisk (templateJSON) {
        var iothreads = _getMaxIothreads(templateJSON);
        if (iothreads === 0){
            $('#attachDiskVMDialogForm input[name="IOTHREAD"]').attr('disabled','disabled');
            $('#attachDiskVMDialogForm input[name="IOTHREAD"]').removeAttr('max');
        }else{
            $('#attachDiskVMDialogForm input[name="IOTHREAD"]').removeAttr('disabled');
            $('#attachDiskVMDialogForm input[name="IOTHREAD"]').attr('max', iothreads);
        }
    }

});