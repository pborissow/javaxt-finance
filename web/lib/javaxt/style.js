if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.style) javaxt.dhtml.style={};

//******************************************************************************
//**  Default Style
//******************************************************************************
/**
 *   Common style definitions for JavaXT components.
 *
 ******************************************************************************/

javaxt.dhtml.style.default = {
    
    window : {
        panel: "window",
        header: "panel-header window-header",
        title: "panel-title window-title",
        button: "window-header-button",
        buttonBar: {
            float: "right",
            padding: "9px"
        },
        mask: "window-mask"
    },
    
    
    form : {
        label: "form-label",
        input: "form-input",
        icon: {
            padding: "0 8px 6px 0"
        },
        button: "form-button",
        radio: "form-radio"
    },
    
    
    combobox : { //style is also used by URLField
        input: "form-input form-input-with-button",
        button: "form-button form-input-button pulldown-button-icon",
        menu: "form-input-menu",
        option: "form-input-menu-item"
    },
    
    
    /*
    checkbox : {
        box:   "facet-checkbox",
        label: "facet-checkbox-label",
        hover: {
            border: "1px solid rgb(" + color + ")",
            background: color2
        },
        select: {
            border: "1px solid #adadad",
            background: medium
        },
        check: {
            content: "",
            display: "block",
            width: "3px",
            height: "6px",
            border: "solid rgb(" + color + ")",
            borderWidth: "0 2px 2px 0",
            transform: "rotate(45deg)",
            margin: "1px 0 0 4px"
        }

    },
    */
   
    toolbarButton : {
        button: "toolbar-button",
        select: "toolbar-button-selected",
        hover:  "toolbar-button-hover",
        label: "toolbar-button-label"
    },
    
    
    table: {
        headerRow: "table-header",
        headerColumn : "table-header-col",
        row: "table-row",
        column: "table-col",
        selectedRow: "table-row-selected",
        resizeHandle: "table-resizeHandle"
    },
    
    tabPanel: {
        
    },

    merge : function(settings, defaults) {
        javaxt.dhtml.utils.merge(settings, defaults);
        return settings;
    }
};