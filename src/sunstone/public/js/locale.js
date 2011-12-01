var lang=""
var locale = {};
var datatable_lang = "";

function tr(str){
    var tmp = locale[str];
    if ( tmp == null || tmp == "" ) {
        //console.debug("trans: "+str);
        tmp = str;
    }
    return tmp;
};

function setLang(lang_str){
    $('<div title="Changing language">Loading new language... please wait '+spinner+'</div>').dialog({
        draggable:false,
        modal:true,
        resizable:false,
        buttons:{},
        width: 460,
        minHeight: 50

    });

    var template = "LANG="+lang_str;
    var obj = {
        data: {
            id: uid,
            extra_param: template
        },
        error: onError
    };
    OpenNebula.User.update(obj);
    $.post('config',JSON.stringify({lang:lang_str}),refreshLang);
};

function refreshLang(){
    window.location.href = ".";
};

$(document).ready(function(){
    if (lang)
        $('#lang_sel option[value="'+lang+'"]').attr("selected","selected");
    $('#lang_sel').change(function(){
        setLang($(this).val());
    });

});