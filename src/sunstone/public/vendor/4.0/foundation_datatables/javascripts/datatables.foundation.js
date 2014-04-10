/* Set the defaults for DataTables initialisation */
$.extend( true, $.fn.dataTable.defaults, {
    "sDom":
        "t"+
        "<'row collapse'<'small-6 columns'i><'small-6 columns'lp>>",
    "oLanguage": {
        "sLengthMenu": "_MENU_",
        "sEmptyTable": '<div class="text-center" style="font-size: 18px; color: #999">'+
                  '<br>'+
                  '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
                  '</span>'+
                  '<br>'+
                  '<br>'+
                  '<span style=" color: #999">'+
                    'There is no data available'+
                  '</span>'+
                  '</div>'+
                  '<br>'
    }
} );



// In 1.10 we use the pagination renderers to draw the Bootstrap paging,
// rather than  custom plug-in
if ( $.fn.dataTable.Api ) {
    $.fn.dataTable.defaults.renderer = 'foundation';
    $.fn.dataTable.ext.renderer.pageButton.foundation = function ( settings, host, idx, buttons, page, pages ) {
        var api = new $.fn.dataTable.Api( settings );
        var classes = settings.oClasses;
        var lang = settings.oLanguage.oPaginate;
        var btnDisplay, btnClass;

        var attach = function( container, buttons ) {
            var i, ien, node, button;
            var clickHandler = function ( e ) {
                e.preventDefault();
                if ( e.data.action !== 'ellipsis' ) {
                    api.page( e.data.action ).draw( false );
                }
            };

            for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
                button = buttons[i];

                if ( $.isArray( button ) ) {
                    attach( container, button );
                }
                else {
                    btnDisplay = '';
                    btnClass = '';

                    switch ( button ) {
                        case 'ellipsis':
                            btnDisplay = '&hellip;';
                            btnClass = 'unavailable';
                            break;

                        case 'first':
                            btnDisplay = lang.sFirst;
                            btnClass = button + (page > 0 ?
                                '' : ' unavailable');
                            break;

                        case 'previous':
                            btnDisplay = lang.sPrevious;
                            btnClass = button + (page > 0 ?
                                '' : ' unavailable');
                            break;

                        case 'next':
                            btnDisplay = lang.sNext;
                            btnClass = button + (page < pages-1 ?
                                '' : ' unavailable');
                            break;

                        case 'last':
                            btnDisplay = lang.sLast;
                            btnClass = button + (page < pages-1 ?
                                '' : ' unavailable');
                            break;

                        default:
                            btnDisplay = button + 1;
                            btnClass = page === button ?
                                'current' : '';
                            break;
                    }

                    if ( btnDisplay ) {
                        node = $('<li>', {
                                'class': classes.sPageButton+' '+btnClass,
                                'aria-controls': settings.sTableId,
                                'tabindex': settings.iTabIndex,
                                'id': idx === 0 && typeof button === 'string' ?
                                    settings.sTableId +'_'+ button :
                                    null
                            } )
                            .append( $('<a>', {
                                    'href': '#'
                                } )
                                .html( btnDisplay )
                            )
                            .appendTo( container );

                        settings.oApi._fnBindAction(
                            node, {action: button}, clickHandler
                        );
                    }
                }
            }
        };

        attach(
            $(host).empty().html('<ul class="pagination"/>').children('ul'),
            buttons
        );
    }
}
else {
    // Integration for 1.9-
    $.fn.dataTable.defaults.sPaginationType = 'foundation';

    /* API method to get paging information */
    $.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
    {
        return {
            "iStart":         oSettings._iDisplayStart,
            "iEnd":           oSettings.fnDisplayEnd(),
            "iLength":        oSettings._iDisplayLength,
            "iTotal":         oSettings.fnRecordsTotal(),
            "iFilteredTotal": oSettings.fnRecordsDisplay(),
            "iPage":          oSettings._iDisplayLength === -1 ?
                0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
            "iTotalPages":    oSettings._iDisplayLength === -1 ?
                0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
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

                $(nPaging).append(
                    '<ul class="pagination">'+
                        '<li class="prev arrow unavailable"><a href="">&laquo;</a></li>'+
                        '<li class="next arrow unavailable"><a href="">&raquo;</a></li>'+
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
                var pages = [];
                var i, ien, klass, host;

                // This could use some improving - however, see
                // https://github.com/DataTables/DataTables/issues/163 - this will
                // be changing in the near future, so not much point in doing too
                // much just now
                if ( oPaging.iTotalPages <= 6 ) {
                    for ( i=0 ; i<oPaging.iTotalPages ; i++ ) {
                        pages.push( i );
                    }
                }
                else {
                    // Current page
                    pages.push( oPaging.iPage );

                    // After current page
                    var pagesAfter = oPaging.iPage + 2 >= oPaging.iTotalPages ?
                        oPaging.iTotalPages :
                        oPaging.iPage + 2;
                    for ( i=oPaging.iPage+1 ; i<pagesAfter ; i++ ) {
                        pages.push( i );
                    }

                    // After gap
                    if ( pagesAfter < oPaging.iTotalPages-2 ) {
                        pages.push( null );
                    }

                    // End
                    if ( $.inArray( oPaging.iTotalPages-2, pages ) === -1 && oPaging.iPage < oPaging.iTotalPages-2 ) {
                        pages.push( oPaging.iTotalPages-2 );
                    }
                    if ( $.inArray( oPaging.iTotalPages-1, pages ) === -1 ) {
                        pages.push( oPaging.iTotalPages-1 );
                    }

                    // Pages before
                    var pagesBefore = oPaging.iPage - 2 > 0 ?
                        oPaging.iPage - 2 :
                        0;
                    for ( i=oPaging.iPage-1 ; i>pagesBefore ; i-- ) {
                        pages.unshift( i );
                    }

                    // Before gap
                    if ( pagesBefore > 1 ) {
                        pages.unshift( null );
                    }

                    // Start
                    if ( $.inArray( 1, pages ) === -1 && oPaging.iTotalPages > 1 ) {
                        pages.unshift( 1 );
                    }
                    if ( $.inArray( 0, pages ) === -1 ) {
                        pages.unshift( 0 );
                    }
                }

                for ( i=0, ien=an.length ; i<ien ; i++ ) {
                    // Remove the middle elements
                    host = an[i];
                    $('li:gt(0)', host).filter(':not(:last)').remove();

                    // Add the new list items and their event handlers
                    $.each( pages, function( i, page ) {
                        klass = page === null ? 'unavailable' :
                            page === oPaging.iPage ? 'current' : '';
                        $('<li class="'+klass+'"><a href="">'+(page===null? '&hellip;' : page+1)+'</a></li>')
                            .insertBefore( $('li:last', host) )
                            .bind('click', function (e) {
                                e.preventDefault();
                                var pageNum = parseInt($('a', this).text(),10);
                                if ( ! isNaN(pageNum)) {
                                    oSettings._iDisplayStart = (pageNum-1) * oPaging.iLength;
                                    fnDraw( oSettings );
                                }
                            } );
                    } );

                    // Add / remove disabled classes from the static elements
                    if ( oPaging.iPage === 0 ) {
                        $('li:first', host).addClass('unavailable');
                    } else {
                        $('li:first', host).removeClass('unavailable');
                    }

                    if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
                        $('li:last', host).addClass('unavailable');
                    } else {
                        $('li:last', host).removeClass('unavailable');
                    }
                }
            }
        }
    } );
}


/*
 * TableTools Foundation compatibility
 * Required TableTools 2.1+
 */
if ( $.fn.DataTable.TableTools ) {
    // Set the classes that TableTools uses to something suitable for Foundation
    $.extend( true, $.fn.DataTable.TableTools.classes, {
        "container": "DTTT button-group",
        "buttons": {
            "normal": "button",
            "disabled": "disabled"
        },
        "collection": {
            "container": "DTTT_dropdown dropdown-menu",
            "buttons": {
                "normal": "",
                "disabled": "disabled"
            }
        },
        "select": {
            "row": "active"
        }
    } );

    // Have the collection use a bootstrap compatible dropdown
    $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
        "collection": {
            "container": "ul",
            "button": "li",
            "liner": "a"
        }
    } );
}
