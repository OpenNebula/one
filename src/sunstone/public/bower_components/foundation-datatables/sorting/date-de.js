/**
 * This sorting plug-in for DataTables will correctly sort data in date time
 * format typically used in Germany - `dd.mm.YYYY HH:mm`.
 *
 *  @name Date / time (dd.mm.YYYY HH:mm)
 *  @summary Sort date / time in the format `dd.mm.YYYY HH:mm`.
 *  @author [Ronny Vedrilla](http://www.ambient-innovation.com)
 *
 *  @example
 *    $('#example').dataTable( {
 *       columnDefs: [
 *         { type: 'de_datetime', targets: 0 }
 *       ]
 *    } );
 */

 jQuery.extend( jQuery.fn.dataTableExt.oSort, {
	"de_datetime-asc": function ( a, b ) {
		var x, y;
		if ($.trim(a) !== '') {
			var deDatea = $.trim(a).split(' ');
			var deTimea = deDatea[1].split(':');
			var deDatea2 = deDatea[0].split('.');
			x = (deDatea2[2] + deDatea2[1] + deDatea2[0] + deTimea[0] + deTimea[1]) * 1;
		} else {
			x = Infinity; // = l'an 1000 ...
		}

		if ($.trim(b) !== '') {
			var deDateb = $.trim(b).split(' ');
			var deTimeb = deDateb[1].split(':');
			deDateb = deDateb[0].split('.');
			y = (deDateb[2] + deDateb[1] + deDateb[0] + deTimeb[0] + deTimeb[1]) * 1;
		} else {
			y = Infinity;
		}
		var z = ((x < y) ? -1 : ((x > y) ? 1 : 0));
		return z;
	},

	"de_datetime-desc": function ( a, b ) {
		var x, y;
		if ($.trim(a) !== '') {
			var deDatea = $.trim(a).split(' ');
			var deTimea = deDatea[1].split(':');
			var deDatea2 = deDatea[0].split('.');
			x = (deDatea2[2] + deDatea2[1] + deDatea2[0] + deTimea[0] + deTimea[1]) * 1;
		} else {
			x = Infinity;
		}

		if ($.trim(b) !== '') {
			var deDateb = $.trim(b).split(' ');
			var deTimeb = deDateb[1].split(':');
			deDateb = deDateb[0].split('.');
			y = (deDateb[2] + deDateb[1] + deDateb[0] + deTimeb[0] + deTimeb[1]) * 1;
		} else {
			y = Infinity;
		}
		var z = ((x < y) ? 1 : ((x > y) ? -1 : 0));
		return z;
	}
} );

