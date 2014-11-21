(function(window, document, $, undefined) {


$.fn.dataTableExt.oApi.fnLengthChange = function ( oSettings, iDisplay ) {
	oSettings._iDisplayLength = iDisplay;
	oSettings.oApi._fnCalculateEnd( oSettings );
	  
	/* If we have space to show extra rows (backing up from the end point - then do so */
	if ( oSettings._iDisplayEnd == oSettings.aiDisplay.length ) {
		oSettings._iDisplayStart = oSettings._iDisplayEnd - oSettings._iDisplayLength;
		if ( oSettings._iDisplayStart < 0 ) {
			oSettings._iDisplayStart = 0;
		}
	}
	  
	if ( oSettings._iDisplayLength == -1 ) {
		oSettings._iDisplayStart = 0;
	}
	  
	oSettings.oApi._fnDraw( oSettings );
};


$.fn.dataTable.LengthLinks = function ( oSettings ) {
	var container = $('<div></div>').addClass( oSettings.oClasses.sLength );
	var lastLength = -1;
	var draw = function () {
		// No point in updating - nothing has changed
		if ( oSettings._iDisplayLength === lastLength ) {
			return;
		}

		var menu = oSettings.aLengthMenu;
		var lang = menu.length===2 && $.isArray(menu[0]) ? menu[1] : menu;
		var lens = menu.length===2 && $.isArray(menu[0]) ? menu[0] : menu;

		var out = $.map( lens, function (el, i) {
			return el == oSettings._iDisplayLength ?
				'<a class="active" data-length="'+lens[i]+'">'+lang[i]+'</a>' :
				'<a data-length="'+lens[i]+'">'+lang[i]+'</a>';
		} );

		container.html( oSettings.oLanguage.sLengthMenu.replace( '_MENU_', out.join(' ') ) );
		lastLength = oSettings._iDisplayLength;
	};

	// API, so the feature wrapper can return the node to insert
	this.container = container;

	// Update on each draw
	oSettings.aoDrawCallback.push( {
		"fn": function () {
			draw();
		},
		"sName": "PagingControl"
	} );

	// Listen for events to change the page length
	container.on( 'click', 'a', function (e) {
		e.preventDefault();
		oSettings.oInstance.fnLengthChange( parseInt( $(this).attr('data-length'), 10 ) );
	} );
}

// Subscribe the feature plug-in to DataTables, ready for use
$.fn.dataTableExt.aoFeatures.push( {
	"fnInit": function( oSettings ) {
		var l = new $.fn.dataTable.LengthLinks( oSettings );
		return l.container[0];
	},
	"cFeature": "L",
	"sFeature": "LengthLinks"
} );


})(window, document, jQuery);


// DataTables initialisation
$(document).ready(function() {
	$('#example').dataTable( {
	  "sDom": "Lfrtip"
	} );
} );