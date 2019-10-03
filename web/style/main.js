if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};


javaxt.express.finance.style =
javaxt.dhtml.utils.merge({
    facet: {
        panel: "facet-panel",
        header: "facet-header",
        subtitle: {
            position: "absolute",
            right: "5px",
            bottom: "5px",
            fontSize: "10px",
            fontWeight: "normal",
            color: "#7f7f7f"
        },
        body: "facet-body",
        label: "facet-label",
        checkmark: "checkmark"
    }
}, javaxt.dhtml.style.default);