/*globals qq */
// Base handler for UI (FineUploader mode) events.
// Some more specific handlers inherit from this one.
qq.UiEventHandler = function(s, protectedApi) {
    "use strict";

    var disposer = new qq.DisposeSupport(),
        spec = {
            eventType: "click",
            attachTo: null,
            onHandled: function(target, event) {}
        };


    // This makes up the "public" API methods that will be accessible
    // to instances constructing a base or child handler
    qq.extend(this, {
        addHandler: function(element) {
            addHandler(element);
        },

        dispose: function() {
            disposer.dispose();
        }
    });

    function addHandler(element) {
        disposer.attach(element, spec.eventType, function(event) {
            // Only in IE: the `event` is a property of the `window`.
            event = event || window.event;

            // On older browsers, we must check the `srcElement` instead of the `target`.
            var target = event.target || event.srcElement;

            spec.onHandled(target, event);
        });
    }

    // These make up the "protected" API methods that children of this base handler will utilize.
    qq.extend(protectedApi, {
        getFileIdFromItem: function(item) {
            return item.qqFileId;
        },

        getDisposeSupport: function() {
            return disposer;
        }
    });


    qq.extend(spec, s);

    if (spec.attachTo) {
        addHandler(spec.attachTo);
    }
};
