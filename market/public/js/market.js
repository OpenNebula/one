/* API method to get paging information */
$.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
{
    return {
        "iStart":         oSettings._iDisplayStart,
        "iEnd":           oSettings.fnDisplayEnd(),
        "iLength":        oSettings._iDisplayLength,
        "iTotal":         oSettings.fnRecordsTotal(),
        "iFilteredTotal": oSettings.fnRecordsDisplay(),
        "iPage":          Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
        "iTotalPages":    Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
    };
}

/* Bootstrap style pagination control */
$.extend( $.fn.dataTableExt.oPagination, {
    "bootstrap": {
        "fnInit": function( oSettings, nPaging, fnDraw ) {
            var oLang = oSettings.oLanguage.oPaginate;
            var fnClickHandler = function ( e ) {
                e.preventDefault();
                if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
                    fnDraw( oSettings );
                }
            };

            $(nPaging).addClass('pagination').append(
                '<ul>'+
                    '<li class="prev disabled"><a href="#">&larr; '+oLang.sPrevious+'</a></li>'+
                    '<li class="next disabled"><a href="#">'+oLang.sNext+' &rarr; </a></li>'+
                '</ul>'
            );
            var els = $('a', nPaging);
            $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
            $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
        },

        "fnUpdate": function ( oSettings, fnDraw ) {
            var iListLength = 5;
            var oPaging = oSettings.oInstance.fnPagingInfo();
            var an = oSettings.aanFeatures.p;
            var i, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

            if ( oPaging.iTotalPages < iListLength) {
                iStart = 1;
                iEnd = oPaging.iTotalPages;
            }
            else if ( oPaging.iPage <= iHalf ) {
                iStart = 1;
                iEnd = iListLength;
            } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
                iStart = oPaging.iTotalPages - iListLength + 1;
                iEnd = oPaging.iTotalPages;
            } else {
                iStart = oPaging.iPage - iHalf + 1;
                iEnd = iStart + iListLength - 1;
            }

            for ( i=0, iLen=an.length ; i<iLen ; i++ ) {
                // Remove the middle elements
                $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                // Add the new list items and their event handlers
                for ( j=iStart ; j<=iEnd ; j++ ) {
                    sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
                    $('<li '+sClass+'><a href="#">'+j+'</a></li>')
                        .insertBefore( $('li:last', an[i])[0] )
                        .bind('click', function (e) {
                            e.preventDefault();
                            oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                            fnDraw( oSettings );
                        } );
                }

                // Add / remove disabled classes from the static elements
                if ( oPaging.iPage === 0 ) {
                    $('li:first', an[i]).addClass('disabled');
                } else {
                    $('li:first', an[i]).removeClass('disabled');
                }

                if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
                    $('li:last', an[i]).addClass('disabled');
                } else {
                    $('li:last', an[i]).removeClass('disabled');
                }
            }
        }
    }
} );


$.extend( $.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
} );

/* API method to get column information */
(function($) {
/*
 * Function: fnGetColumnData
 * Purpose:  Return an array of table values from a particular column.
 * Returns:  array string: 1d data array
 * Inputs:   object:oSettings - dataTable settings object. This is always the last argument   past to the function
 *           int:iColumn - the id of the column to extract the data from
 *           bool:bUnique - optional - if set to false duplicated values are not filtered out
 *           bool:bFiltered - optional - if set to false all the table data is used (not only   the filtered)
 *           bool:bIgnoreEmpty - optional - if set to false empty values are not filtered from  the result array
 * Author:   Benedikt Forchhammer <b.forchhammer /AT\ mind2.de>
 */
$.fn.dataTableExt.oApi.fnGetColumnData = function ( oSettings, iColumn, bUnique, bFiltered,   bIgnoreEmpty ) {
    // check that we have a column id
    if ( typeof iColumn == "undefined" ) return new Array();

    // by default we only wany unique data
    if ( typeof bUnique == "undefined" ) bUnique = true;

    // by default we do want to only look at filtered data
    if ( typeof bFiltered == "undefined" ) bFiltered = true;

    // by default we do not wany to include empty values
    if ( typeof bIgnoreEmpty == "undefined" ) bIgnoreEmpty = true;

    // list of rows which we're going to loop through
    var aiRows;

    // use only filtered rows
    if (bFiltered == true) aiRows = oSettings.aiDisplay;
    // use all rows
    else aiRows = oSettings.aiDisplayMaster; // all row numbers

    // set up data array
    var asResultData = new Array();

    for (var i=0,c=aiRows.length; i<c; i++) {
        iRow = aiRows[i];
        var sValue = this.fnGetData(iRow, iColumn);

        // ignore empty values?
        if (bIgnoreEmpty == true && sValue.length == 0) continue;

        // ignore unique values?
        else if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) continue;

        // else push the value onto the result data array
        else asResultData.push(sValue);
    }

    return asResultData;
}}(jQuery));

function addSelectOption (column, header)
{
  var oTable = $('#apps').dataTable()
  var asResultData = oTable.fnGetColumnData(column)
  var select = $('select#' + header)

  select.append($("<option />").text(''));
  for (var i = 0; i < asResultData.length; i++)
  {
    select.append($("<option />").text(asResultData[i]));
  }

  select.change( function () {
      oTable.fnFilter( $(this).val(), column );
  } );
}

function addInputTypeahead (column, header)
{
  var oTable = $('#apps').dataTable()
  var input = $('input#' + header)

  input.typeahead({source: oTable.fnGetColumnData(column)})

  input.keyup( function () {
      oTable.fnFilter( $(this).val(), column );
  } );
}


/**
 * Convert number of bytes into human readable format
 *
 * @param integer bytes     Number of bytes to convert
 * @param integer precision Number of digits after the decimal separator
 * @return string
 */
function bytesToSize(bytes, precision)
{
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;

    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';

    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';

    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';

    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';

    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';

    } else {
        return bytes + ' B';
    }
}

function update_form_content(response, form) {
  var a = $(form).serializeArray();

  $.each(a, function() {
    var str_array = this.name.split('.')

    var element_id = "#" + str_array.join("\\.") + "_form"

    if ($(element_id)[0]) {
      var value
      var key = str_array[0]

      if (key == 'files'){
        var index = parseInt(str_array[1])
        var sec_key = str_array[2]

        value = response[key][index][sec_key]
      } else {
        value = response[str_array[0]]
      }

      if (value) {
        $(element_id, form)[0].value = value
      }
    }
  } )
}

// Create forms
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();

    $.each(a, function() {
        if (this.value) {
            var str_array = this.name.split('.')
            var key = str_array[0]

            if (key == 'files'){
                var index = str_array[1]
                var file_key = str_array[2]

                if (!o[key]) {
                    o[key] = [];
                }

                if (!o[key][index]) {
                    o[key][index] = {};
                }

                o[key][index][file_key] = this.value;
            } else if (key == 'tags') {
              o[key] = this.value.split(',');
            } else {
              o[key] = this.value;
            }
        }

    });

    return o;
};

function clearForm(oForm) {
  var elements = oForm.elements;

  oForm.reset();

  for(i=0; i<elements.length; i++) {
    field_type = elements[i].type.toLowerCase();

    switch(field_type) {
      case "text":
      case "password":
      case "textarea":
      case "hidden":
        elements[i].value = "";
        break;
      case "radio":
      case "checkbox":
        if (elements[i].checked) {
          elements[i].checked = false;
        }
        break;
      case "select-one":
      case "select-multi":
        elements[i].selectedIndex = -1;
        break;
      default:
        break;
    }
  }
};

function disableEnterKey(e)
{
     var key;
     if(window.event)
          key = window.event.keyCode;     //IE
     else
          key = e.which;     //firefox
     if(key == 13)
          return false;
     else
          return true;
}