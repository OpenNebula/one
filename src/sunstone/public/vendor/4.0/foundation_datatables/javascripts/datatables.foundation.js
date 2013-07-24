/* Set the defaults for DataTables initialisation */
$.extend( true, $.fn.dataTable.defaults, {
    "sDom": "<'H'>t<'row'<'eight columns'li><'four columns'p>>",
    "sPaginationType": "foundation",
    "oLanguage": {
        "sLengthMenu": '<select><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select>&emsp;&emsp;'
    }

} );


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
};

/* Bootstrap style pagination control */
$.extend( $.fn.dataTableExt.oPagination, {
    "foundation": {
        "fnInit": function( oSettings, nPaging, fnDraw ) {
            var oLang = oSettings.oLanguage.oPaginate;
            var fnClickHandler = function ( e ) {
                e.preventDefault();
                if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
                    fnDraw( oSettings );
                }
            };

            $(nPaging).addClass('pagination').append(
                '<ul class="pagination">' +
                    '<li class="prev unavailable"><a href="#"><i class="icon-double-angle-left"/></a></li>' +
                    '<li class="prev unavailable"><a href="#"><i class="icon-angle-left"/></a></li>'+
                    '<li class="next unavailable"><a href="#"><i class="icon-angle-right"/></a></li>' +
                    '<li class="next unavailable"><a href="#"><i class="icon-double-angle-right"/></a></li>' +
                '</ul>'
            );
            var els = $('a', nPaging);
            $(els[0]).bind('click.DT', { action: "first" }, fnClickHandler);
            $(els[1]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
            $(els[2]).bind('click.DT', { action: "next" }, fnClickHandler);
            $(els[3]).bind('click.DT', { action: "last" }, fnClickHandler);
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
                $('li:gt(1)', an[i]).filter(':not(.next)').remove();

                // Add the new list items and their event handlers
                for ( j=iStart ; j<=iEnd ; j++ ) {
                    sClass = (j==oPaging.iPage+1) ? 'class="current"' : '';
                    $('<li '+sClass+'><a href="#">'+j+'</a></li>')
                        .insertBefore( $('li.next:first', an[i])[0] )
                        .bind('click', function (e) {
                            e.preventDefault();
                            oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                            fnDraw( oSettings );
                        });
                }

                // Add / remove disabled classes from the static elements
                if ( oPaging.iPage === 0 ) {
                    $('li.prev', an[i]).addClass('unavailable');
                } else {
                    $('li.prev', an[i]).removeClass('unavailable');
                }

                if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
                    $('li.next', an[i]).addClass('unavailable');
                } else {
                    $('li.next', an[i]).removeClass('unavailable');
                }
            }
        }
    }
}
);
