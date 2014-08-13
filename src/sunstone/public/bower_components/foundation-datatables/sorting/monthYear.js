/**
 * This sorting plug-in will sort, in calendar order, data which
 * is in the format "MM YY".
 *
 *  @name Date (MM YY)
 *  @anchor Sort dates in the format `MM YY`
 *  @author Michael Motek
 *
 *  @example
 *    $('#example').dataTable( {
 *       columnDefs: [
 *         { type: 'monthYear', targets: 0 }
 *       ]
 *    } );
 */

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
	"monthYear-pre": function ( s ) {
		var a = s.split(' ');
		// Date uses the American "MM DD YY" format
		return new Date(a[0]+' 01 '+a[1]);
	},

	"monthYear-asc": function ( a, b ) {
		return ((a < b) ? -1 : ((a > b) ? 1 : 0));
	},

	"monthYear-desc": function ( a, b ) {
		return ((a < b) ? 1 : ((a > b) ?  -1 : 0));
	}
} );
