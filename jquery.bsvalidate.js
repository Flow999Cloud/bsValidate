/*!
 * jQuery bsValidate Plugin
 * Form Validation for Twitter Bootstrap Forms (https://github.com/matthewjmink/bsValidate)
 * Copyright 2015 Matt Mink
 * Licensed under MIT (https://github.com/matthewjmink/bsValidate/blob/master/LICENSE)
 */

;(function ( $, window, document, undefined ) {

    "use strict";

    var bsValidate = "bsValidate",
    
    defaults = {
        requiredSelector: "input.required:not(:checkbox),textarea.required,select.required,[required]",
        fields: {},
        blankSelectValue: "",
        success: function(){},
        fail: function(e){e.preventDefault();}
    };
        
    $.extend(Plugin.prototype, {

        init: function () {
            var bsv = this;
            var form = $(bsv.element);
            var required = form.find(bsv.settings.requiredSelector);
            var fields = bsv.settings.fields;

            required.each(function(){
                var name = $(this).attr('name');
                if(typeof fields[name] === "undefined" || typeof fields[name].required === "undefined"){
                    var formGroup = $(this).parents('.form-group');
                    var label = formGroup.find('.label,label').text();
                    fields[name] = (typeof fields[name] === "undefined") ? {} : fields[name];
                    fields[name].el = $(this);
                    fields[name].required = {
                        alert: label + " is required."
                    };
                }
            });
            $.each( fields, function( key, value ) {
                if(typeof fields[key].el !== "object" || typeof fields[key].el.jquery === "undefined"){
                    fields[key].el = form.find('[name="'+key+'"]');
                }
                fields[key].el.on('change', {bsv:bsv, fields:fields, key:key, value:value} , bsvFieldChange);
            });
            form.submit(function(e){
                var isValid = true;
                $.each( fields, function( key, value ) {
                    var styleClass;
                    var formGroup = fields[key].el.parents('.form-group');
                    var errCnt = 0;
                    var v = fields[key].el.val();
                    var styleKey = key.replace(/[^a-zA-Z\d-]/g, '-');
                    if(typeof fields[key].required !== "undefined"){
                        styleClass = 'alert-'+styleKey+'-required';
                        errCnt += toggleAlert(fields[key].el.isBlank(bsv), fields[key].required.alert, bsv.settings.alertTarget, styleClass);
                    }
                    if(typeof fields[key].email !== "undefined"){
                        styleClass = 'alert-'+styleKey+'-email';
                        errCnt += toggleAlert(!isValidEmail(v) && !fields[key].el.isBlank(bsv), fields[key].email.alert, bsv.settings.alertTarget, styleClass);
                    }
                    if(typeof fields[key].characters !== "undefined"){
                        styleClass = 'alert-'+styleKey+'-characters';
                        errCnt += toggleAlert(v.length > fields[key].characters.limit, fields[key].characters.alert, bsv.settings.alertTarget, styleClass);
                    }
                    if(errCnt > 0){
                        formGroup.addClass('has-error');
                        isValid = false;
                    }else{
                        formGroup.removeClass('has-error');
                    }
                });
                if(isValid){
                    bsv.settings.success(e);
                }else{
                    bsv.settings.fail(e);
                }
            });
        },
        destroy: function(callback) {
            var bsv = this;
            var fields = bsv.settings.fields;
            bsv.settings.fields = {};
            $.each( fields, function( key, field ) {
                if(typeof field.el === "object" && typeof field.el.jquery !== "undefined"){
                    field.el.off('change', bsvFieldChange);
                }
            });
            $(bsv.element).off("submit").removeData();
            if(callback){
                callback();
            }
        }
    });

    $.fn[ bsValidate ] = function ( options ) {
        return this.each(function() {
            var el = this;
            var plugin = $.data( this, "plugin_" + bsValidate );
            if ( !plugin ) {
                $.data( this, "plugin_" + bsValidate, new Plugin( this, options ) );
            }else if(options === "destroy"){
                plugin.destroy();
            }
        });
    };

    $.fn.isBlank = function ( bsv ) {
        var val = this.val();
        return (val === "" || val === null || val.length < 1 || (this[0].nodeName.toLowerCase() === 'select' && val == bsv.settings.blankSelectValue));
    };

    $.fn.destroy = function ( ) {
        return this.each(function() {
            var plugin = $.data( this, "plugin_" + bsValidate );
            if ( !!plugin ) {
                plugin.destroy();
            }
        });
    };

    function Plugin ( element, options ) {
        defaults.alertTarget = $(element);
        this.element = element;
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = bsValidate;
        this.init();
    }

    function toggleHelpText(test, helpText, formGroup, styleClass){
        if(test){
            if(typeof helpText !== "undefined"){
                addHelpText(formGroup, helpText, styleClass);
            }
            return 1;
        }else{
            if(typeof helpText !== "undefined"){
                removeHelpText(formGroup, styleClass);
            }
        }
        return 0;
    }
    
    function toggleAlert(test, alertText, alertTarget, styleClass){
        if(test){
            if(typeof alertText !== "undefined"){
                addAlert(alertTarget, alertText, styleClass);
            }
            return 1;
        }else{
            if(typeof alertText !== "undefined"){
                removeAlert(alertTarget, styleClass);
            }
        }
        return 0;
    }
    
    function addHelpText(formGroup, message, styleClass){
        if(formGroup.find('.'+styleClass).length < 1){
            var helpText = $('<span class="help-block '+styleClass+'">'+message+'</span>');
            formGroup.append(helpText);
        }
    }

    function removeHelpText(formGroup, styleClass){
        var helpText = formGroup.find('.'+styleClass);
        helpText.remove();
    }

    function addAlert(target, message, styleClass){
        if(target.find('.'+styleClass).length < 1){
            var alert = $('<div class="alert alert-danger ' +styleClass+ '">'+message+'</div>');
            target.prepend(alert);
        }
    }

    function removeAlert(target, styleClass){
        var alert = target.find('.'+styleClass);
        alert.remove();
    }

    function bsvFieldChange(event){
        var data = event.data;
        var el = $(event.target);
        var bsv = data.bsv;
        var fields = data.fields;
        var key = data.key;
        var formGroup = el.parents('.form-group');
        var errCnt = 0;
        var styleClass;
        var v = el.val();
        if(typeof fields[key].required !== "undefined"){
            styleClass = 'help-required';
            errCnt += toggleHelpText(el.isBlank(bsv), fields[key].required.helpText, formGroup, styleClass);
        }
        if(typeof fields[key].email !== "undefined"){
            styleClass = 'help-email';
            errCnt += toggleHelpText(!isValidEmail(v) && v !== "", fields[key].email.helpText, formGroup, styleClass);
        }
        if(typeof fields[key].characters !== "undefined"){
            styleClass = 'help-characters';
            errCnt += toggleHelpText(v.length > fields[key].characters.limit, fields[key].characters.helpText, formGroup, styleClass);
        }
        if(errCnt > 0){
            formGroup.addClass('has-error');
        }else{
            formGroup.removeClass('has-error');
        }
    }

    function isValidEmail(email){
         var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
         return re.test(email);
    }

})( jQuery, window, document );