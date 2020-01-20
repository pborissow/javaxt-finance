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
        checkbox: "facet-checkbox",
        checkmark: "facet-checkmark"
    },
    colors: [
        "#FEFE33",
        "#FABC02",
        "#FB9902",
        "#FD5308",
        "#FE2712",
        "#A7194B",
        "#8601AF",
        "#3D01A4",
        "#0247FE",
        "#0392CE",
        "#66B032",
        "#D0EA2B"
    ]
}, javaxt.dhtml.style.default);