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

define(function (require) {
  /* DEPENDENCIES */

  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var OpenNebulaUser = require("opennebula/user");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");
  var Tree = require("./tree");

  var LABELS_ATTR = "LABELS";

  return {
    labelsStr: _labelsStr,
    deserializeLabels: _deserializeLabels,
    makeTree: _makeTree,
    insertLabelsMenu: _insertLabelsMenu,
    insertLabelsDropdown: _insertLabelsDropdown,
    clearLabelsFilter: _clearLabelsFilter,
    setLabelsFilter: _setLabelsFilter,
    getLabelsFilter: _getLabelsFilter,
    getLabels: _getLabels,
    getLabel: _getLabel,
  };

  /* FUNCTION DEFINITIONS */

  /**
   * Add labels tree to the left menu
   * @param {Object}        opts - Options
   * @param {string}        opts.tabName - Tab Name to retrieve the rest of the opts
   * @param {jQuery Object} [opts.context] - jQuery object to insert the menu, if not
   *                          provided the link of the tab in the left menu will be used
   * @param {DataTable}     [opts.dataTable] - Datatable to apply the filter, if not
   *                          provided the one defined in the Sunstone tab will be used
   * @param {Number}        [opts.labelsColumn] - Column of the labels in the datatable,
   *                          if not provided the one defined in the Sunstone tab datatable
   *                          will be used
   * @param {string}        [opts.labelsPath] - Path of the labels attr, this value will be
   *                          used if the datatable uses aData object instead of an array w
   *                          ith the values
   * @param {string}        [opts.placeholder] - Message to be shown in no labels are defined
   */
  function _insertLabelsMenu(opts) {
    var context = opts.context || $("#li_" + opts.tabName);
    var dataTable =
      opts.dataTable || Sunstone.getDataTable(opts.tabName).dataTable;
    var labelsColumn =
      opts.labelsColumn || Sunstone.getDataTable(opts.tabName).labelsColumn;
    var labelsPath = opts.labelsPath;
    var labels = _getLabels(dataTable, labelsColumn, labelsPath);

    $(".labels-tree", context).remove();
    if ($.isEmptyObject(labels)) {
      if (opts.placeholder) {
        context.html("<div class=\"text-center\">" + opts.placeholder + "</div>");
      }
    } else {
      context.append(Tree.html(_makeTree(labels), true));

      context.off("click", ".labeltree-line");

      Tree.setup($(".labels-tree", context));

      var currentLabel = $(
        "span[one-label-full-name=\"" + _getLabelsFilter(dataTable) + "\"]",
        context
      );

      if (currentLabel.length == 0) {
        _clearLabelsFilter(dataTable, labelsColumn);
      } else {
        currentLabel.parent(".labeltree-line").click();
        currentLabel
          .parentsUntil(".labels-tree", "li")
          .children(".tree-toggle")
          .click();
      }
    }

    /*
      Filter datatable when a label in the left menu is clicked
     */
    context.off("click", ".labeltree-line");
    context.on("click", ".labeltree-line", function () {
      var span = $(".one-label", this);

      if ($(span).hasClass("active")) {
        if (opts.tabName && !Sunstone.rightListVisible($("#" + opts.tabName))) {
          Sunstone.showTab(opts.tabName);
        }

        var label = $(span).attr("one-label-full-name");

        _setLabelsFilter(dataTable, labelsColumn, label);
      } else {
        _clearLabelsFilter(dataTable, labelsColumn);
      }
    });
  }

  /*
    Generate labels dropdown
   */
  function _insertLabelsDropdown(tabName) {
    var tabTable = Sunstone.getDataTable(tabName);
    var dataTable = tabTable.dataTable;
    var labelsColumn = tabTable.labelsColumn;

    var labelsDropdown = $("#" + tabName + "LabelsDropdown");

    OpenNebulaUser.show({
      data: {
        id: config["user_id"],
      },
      success: function (request, user_json) {
        var labels_persis = "";
        if (user_json["USER"]["TEMPLATE"]) {
          if (user_json["USER"]["TEMPLATE"]["LABELS"]) {
            labels_persis = user_json["USER"]["TEMPLATE"]["LABELS"];
          }
        }
        var labels = _getLabels(dataTable, labelsColumn);
        labels_persis = _deserializeLabels(labels_persis);
        var array_labels_yaml = [];
        var labels_yaml = {};
        if (config["all_labels"][0] != "") {
          $.each(config["all_labels"], function (index) {
            array_labels_yaml.push(config["all_labels"][index] + "_YAML");
            if (labels[config["all_labels"][index]]) {
              delete labels[config["all_labels"][index]];
            }
          });

          labels_yaml = _deserializeLabels(array_labels_yaml.join(","));
        }
        var keys = Object.keys(labels_persis).sort();
        for (var i = 0; i < keys.length; i++) {
          if (labels[keys[i]]) {
            delete labels[keys[i]];
          }
          labels_persis[keys[i] + "_PERSIS"] = labels_persis[keys[i]];
          delete labels_persis[keys[i]];
        }
        $.extend(labels, labels_persis);
        var html_yaml = "";
        if (!$.isEmptyObject(labels_yaml)) {
          html_yaml =
            "<h6>" +
            Locale.tr("System Labels") +
            "</h6>" +
            "<div class=\"labeltree-container\">" +
            Tree.html(_makeTree(labels_yaml), false) +
            "</div>";
        }
        labelsDropdown.html(
          "<div>" +
            "<h6>" +
            Locale.tr("Edit Labels") +
            "</h6>" +
            "<div class=\"labeltree-container\">" +
            Tree.html(_makeTree(labels), false) +
            "</div>" +
            html_yaml +
            "<div class=\"input-container\">" +
            "<input type=\"text\" class=\"newLabelInput\" placeholder=\"" +
            Locale.tr("Add Label") +
            "\"/>" +
            "</div>" +
            "</div>"
        );

        Tree.setup(labelsDropdown);
        recountLabels();
        $("[data-toggle=\"" + tabName + "LabelsDropdown\"]").off("click");
        $("[data-toggle=\"" + tabName + "LabelsDropdown\"]").on(
          "click",
          function () {
            recountLabels();
          }
        );
      },
    });
    /*
      Update Dropdown with selected items
      [v] If all the selected items has a label
      [-] If any of the selected items has a label
      [ ] If no selected item has an existing label
     */
    function recountLabels() {
      // Generate Hash with labels and number of items
      var labelsStr,
        labelsIndexed = {};

      var selectedItems = tabTable.elements();
      $.each(selectedItems, function (index, resourceId) {
        labelsStr = _getLabel(tabName, dataTable, labelsColumn, resourceId);
        if (labelsStr != "") {
          $.each(labelsStr.split(","), function () {
            if (labelsIndexed[this]) {
              labelsIndexed[this] += 1;
            } else {
              labelsIndexed[this] = 1;
            }
          });
        }
      });

      // Set checkboxes (check|minus) depending on the number of items

      // Reset label checkboxes
      $(".labelsCheckbox", labelsDropdown)
        .removeClass("fa-minus-square")
        .removeClass("fa-check-square")
        .addClass("fa-square");

      var labelsCheckbox;
      $.each(labelsIndexed, function (labelName, numberOfItems) {
        labelsCheckbox = $(
          ".labelsCheckbox",
          $(
            "[one-label-full-name=\"" + labelName + "\"]",
            labelsDropdown
          ).closest("li")
        );
        if (labelsCheckbox.length > 0) {
          if (numberOfItems == selectedItems.length) {
            $(labelsCheckbox[0])
              .removeClass("fa-square")
              .addClass("fa-check-square");
          } else {
            $(labelsCheckbox[0])
              .removeClass("fa-square")
              .addClass("fa-minus-square");
          }
        }
      });

      $(".newLabelInput", labelsDropdown).focus();
    }

    /*
      Check/Uncheck label & Update Templates
     */
    labelsDropdown.off("click", ".labeltree-line");
    labelsDropdown.on("click", ".labeltree-line", function () {
      var action;
      var that = $(".labelsCheckbox", this);

      if ($(that).hasClass("fa-square")) {
        action = "add";
        $(that).removeClass("fa-square").addClass("fa-check-square");
      } else {
        action = "remove";
        $(that)
          .removeClass("fa-check-square fa-minus-square")
          .addClass("fa-square");
      }
      OpenNebulaUser.show({
        data: {
          id: config["user_id"],
        },
        success: function (request, user_json) {
          var labels_persis = "";
          if (user_json["USER"]["TEMPLATE"]) {
            if (user_json["USER"]["TEMPLATE"]["LABELS"]) {
              labels_persis = user_json["USER"]["TEMPLATE"]["LABELS"];
            }
          }
          var labelName = $(".one-label", $(that).closest("li")).attr(
            "one-label-full-name"
          );
          var labelsArray, labelsArray_persis, labelIndex;
          var selectedItems = tabTable.elements();
          if (labels_persis != "") {
            labelsArray_persis = labels_persis.split(",");
          } else {
            labelsArray_persis = [];
          }
          $.each(selectedItems, function (index, resourceId) {
            labelsStr = _getLabel(tabName, dataTable, labelsColumn, resourceId);
            if (labelsStr != "") {
              labelsArray = labelsStr.split(",");
            } else {
              labelsArray = [];
            }
            labelIndex = $.inArray(labelName, labelsArray);
            if (action == "add" && labelIndex == -1) {
              labelsArray.push(labelName);
              _updateResouceLabels(tabName, resourceId, labelsArray);
            } else if (action == "remove" && labelIndex != -1) {
              if (
                !labelsArray_persis ||
                (labelsArray_persis &&
                  $.inArray(labelName, labelsArray_persis) == -1) ||
                !config["all_labels"] ||
                (config["all_labels"] &&
                  $.inArray(labelName, config["all_labels"]) == -1)
              ) {
                labelsArray.splice(labelIndex, 1);
                _updateResouceLabels(tabName, resourceId, labelsArray);
              }
            }
          });
        },
      });
    });

    /*
      Add a new label when ENTER is presed in the input
     */
    labelsDropdown.off("keypress", ".newLabelInput");
    labelsDropdown.on("keypress", ".newLabelInput", function (e) {
      var ev = e || window.event;
      var key = ev.keyCode;
      var labelName = $(this).val().trim();

      if (key == 13 && !ev.altKey && labelName !== "") {
        var labelsArray;
        var selectedItems = tabTable.elements();

        $.each(selectedItems, function (_, resourceId) {
          labelsStr = _getLabel(tabName, dataTable, labelsColumn, resourceId);
          if (labelsStr != "") {
            labelsArray = labelsStr.split(",");
          } else {
            labelsArray = [];
          }

          labelsArray.push(labelName);
          _updateResouceLabels(tabName, resourceId, labelsArray);
        });

        ev.preventDefault();
      }
    });
  }

  function _updateResouceLabels(tabName, resourceId, labelsArray) {
    var resource = Sunstone.getResource(tabName);
    var tabTable = Sunstone.getDataTable(tabName);

    if (resource == "ServiceTemplate" || resource == "Service") {
      var templateStr =
        "{\"" + LABELS_ATTR.toLowerCase() + "\":\"" + labelsArray.join(",") + "\"}";
    } else {
      var templateStr = LABELS_ATTR + "=\"" + labelsArray.join(",") + "\"";
    }

    OpenNebula[resource].append({
      timeout: true,
      data: {
        id: resourceId,
        extra_param: templateStr,
      },
      success: function (request) {
        OpenNebula[resource].show({
          timeout: true,
          data: {
            id: resourceId,
          },
          success: function (request, response) {
            tabTable.updateElement(request, response);
            if (Sunstone.rightInfoVisible($("#" + tabName))) {
              Sunstone.insertPanels(tabName, response);
            }

            _insertLabelsMenu({ tabName: tabName });
            _insertLabelsDropdown(tabName);
          },
          error: Notifier.onError,
        });
      },
      error: Notifier.onError,
    });
  }

  function _labelsStr(elementTemplate) {
    if (
      elementTemplate &&
      elementTemplate.BODY &&
      elementTemplate.BODY[LABELS_ATTR.toLowerCase()]
    ) {
      return TemplateUtils.htmlEncode(
        elementTemplate.BODY[LABELS_ATTR.toLowerCase()]
      );
    } else {
      return TemplateUtils.htmlEncode(
        elementTemplate && elementTemplate[LABELS_ATTR]
          ? elementTemplate[LABELS_ATTR]
          : ""
      );
    }
  }

  function _deserializeLabels(labelsStr) {
    var indexedLabels = {};

    if (labelsStr) {
      var parent;
      $.each(labelsStr.split(","), function () {
        parent = indexedLabels;
        $.each(this.split("/"), function () {
          if (parent[this] == undefined) {
            parent[this] = {};
          }
          parent = parent[this];
        });
      });
    }

    return indexedLabels;
  }

  function _makeTree(indexedLabels, currentLabel) {
    var treeRoot = {
      htmlStr: "",
      subTree: [],
    };

    var keys = Object.keys(indexedLabels).sort();

    for (var i = 0; i < keys.length; i++) {
      var folderName = keys[i];
      var childs = indexedLabels[folderName];
      treeRoot.subTree.push(_makeSubTree("", folderName, childs, currentLabel));
    }

    return treeRoot;
  }

  function _makeSubTree(parentName, folderName, childs, currentLabel) {
    var name_split = folderName.split("_");
    var persis = false;
    var yaml = false;
    if (name_split.indexOf("PERSIS") > -1) {
      folderName = "";
      $.each(name_split, function (value) {
        if (name_split[value] != "PERSIS") {
          folderName += name_split[value] + "_";
        }
      });
      folderName = folderName.slice(0, -1);
      persis = true;
    } else if (name_split.indexOf("YAML") > -1) {
      folderName = "";
      $.each(name_split, function (value) {
        if (name_split[value] != "YAML") {
          folderName += name_split[value] + "_";
        }
      });
      folderName = folderName.slice(0, -1);
      yaml = true;
    }
    var fullName = parentName + folderName;
    if (persis) {
      var htmlStr =
        "<span class=\"secondary one-label\" persis=\"true\" alt=\"" +
        fullName +
        "\" title=\"" +
        fullName +
        "\" one-label-full-name=\"" +
        fullName +
        "\">" +
        folderName +
        "</span>";
    } else if (yaml) {
      var htmlStr =
        "<span class=\"secondary one-label\" yaml=\"true\" alt=\"" +
        fullName +
        "\" title=\"" +
        fullName +
        "\" one-label-full-name=\"" +
        fullName +
        "\">" +
        folderName +
        "</span>";
    } else {
      var htmlStr =
        "<span class=\"secondary one-label\" alt=\"" +
        fullName +
        "\" title=\"" +
        fullName +
        "\" one-label-full-name=\"" +
        fullName +
        "\">" +
        folderName +
        "</span>";
    }

    var tree = {
      htmlStr: htmlStr,
      subTree: [],
    };

    var keys = Object.keys(childs).sort();
    for (var i = 0; i < keys.length; i++) {
      var subFolderName = keys[i];
      var subChilds = childs[subFolderName];
      tree.subTree.push(
        _makeSubTree(fullName + "/", subFolderName, subChilds, currentLabel)
      );
    }

    return tree;
  }

  /*
    dataTable Filters
   */

  function _setLabelsFilter(dataTable, labelsColumn, label) {
    // Make the label safe, it may contain regexp special characters. Source:
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
    var escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    var regExp =
      "^" +
      escapedLabel +
      "$|" +
      "," +
      escapedLabel +
      "$|" +
      "^" +
      escapedLabel +
      ",|" +
      "," +
      escapedLabel +
      ",";

    dataTable.data("sunstone-label-filter", label);
    dataTable.fnFilter(regExp, labelsColumn, true, false);
  }

  function _clearLabelsFilter(dataTable, labelsColumn) {
    dataTable.removeData("sunstone-label-filter");
    dataTable.fnFilter("", labelsColumn, true, false);
  }

  function _getLabelsFilter(dataTable) {
    return dataTable.data("sunstone-label-filter");
  }

  function _getLabels(dataTable, labelsColumn, labelsPath) {
    var labels = [];
    var tmp;
    $.each(dataTable.fnGetData(), function () {
      if (labelsPath) {
        tmp = this;
        $.each(labelsPath.split("."), function () {
          if (tmp) {
            tmp = tmp[this];
          }
        });
        if (tmp && tmp != "") {
          labels.push(tmp);
        }
      } else {
        if (this[labelsColumn] != "") {
          labels.push(this[labelsColumn]);
        }
      }
    });
    return _deserializeLabels(labels.join(","));
  }

  function _getLabel(tabName, dataTable, labelsColumn, resourceId) {
    if (Sunstone.rightInfoVisible($("#" + tabName))) {
      var element = Sunstone.getElementRightInfo(tabName);
      if (element) {
        var template;
        if (element.USER_TEMPLATE) {
          template = element.USER_TEMPLATE;
        } else {
          template = element.TEMPLATE;
        }
        if (template) {
          if (template["BODY"] && template["BODY"][LABELS_ATTR.toLowerCase()]) {
            return template["BODY"][LABELS_ATTR.toLowerCase()];
          } else {
            return template[LABELS_ATTR] || "";
          }
        } else {
          return "";
        }
      } else {
        return "";
      }
    } else {
      var nodes = dataTable.fnGetNodes();
      var tr = $(".check_item[value=\"" + resourceId + "\"]", nodes).closest(
        "tr"
      );
      var aData = dataTable.fnGetData(tr);
      return aData[labelsColumn];
    }
  }

  /**
   * Returns the label with a clean format
   * @param {string} label
   *
   * Eg: ubuntu linux/alpine => Ubuntu Linux/Alpine
   */
  function transformLabelToCleanFormat(label) {
    let SEPARATOR_SUB_TREE = "/";

    return $.map(label.split(SEPARATOR_SUB_TREE), function (tree) {
      return firstLetterToUppercase(tree);
    }).join(SEPARATOR_SUB_TREE);
  }

  /**
   * Returns the same string but with first letter in uppercase
   * @param {string} phrase
   */
  function firstLetterToUppercase(phrase) {
    let words = splitPhraseWithSpaces(phrase);

    return $.map(words, function (word) {
      return capitalize(word.toLowerCase());
    }).join(" ");
  }

  /**
   * Separate words from phrase using regex to split with white spaces
   * @param {string} [phrase] - Phrase
   */
  function splitPhraseWithSpaces(phrase = "") {
    let validRegex = /[^ ]+/g;

    return String(phrase).match(validRegex);
  }

  /**
   * Convert first letter to upper case
   * @param {string} string
   */
  function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
  }
});
