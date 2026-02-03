if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  AdminPanel
//******************************************************************************
/**
 *   Panel used to render admin components (e.g. UserList)
 *
 ******************************************************************************/

javaxt.express.finance.Admin = function(parent, config) {

    var me = this;
    var defaultConfig = {

    };
    var waitmask;
    var sidebar, mainPanel, landingPage;
    var panel = {};



  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Parse config
        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;
        if (!config.waitmask) config.waitmask = new javaxt.express.WaitMask(document.body);
        waitmask = config.waitmask;


      //Create table
        var table = createTable(parent);
        table.className = "admin-panel";
        var tr = table.addRow();
        var td;


      //Create side bar
        td = tr.addColumn({
            height: "100%"
        });
        sidebar = createElement("div", td, "admin-sidebar");
        sidebar.style.height = "100%";



      //Create main panel
        mainPanel = tr.addColumn({
            width: "100%",
            height: "100%"
        });



      //Create landing page
        landingPage = createElement("div", mainPanel, "admin-landing-page noselect");
        createElement("i", landingPage, "fas fa-cogs");
        addShowHide(landingPage);


      //Create panels
        createPanel("Config", "fas fa-sliders-h", javaxt.express.finance.SourceManager, config);
        createPanel("Database", "fas fa-database", javaxt.express.DBView, {
            waitmask: waitmask,
            style:{
                container: {
                    width: "100%",
                    height: "100%",
                    background: "#fff"
                },
                leftPanel: {
                    background: "#dcdcdc",
                    borderRight: "1px solid #383b41"
                },
                table: javaxt.dhtml.style.default.table,
                toolbarButton: javaxt.dhtml.style.default.toolbarButton
            }
        });
        createPanel("IconSearch", "fas fa-image", javaxt.express.finance.IconSearch, config);



        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){

        for (var key in panel) {
            var app = panel[key].app;
            if (app && app.clear) app.clear();
        }

    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){

    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    this.notify = function(op, model, id, userID){
        for (var key in panel) {
            var app = panel[key].app;
            if (app && app.notify) app.notify(op, model, id, userID);
        }
    };


  //**************************************************************************
  //** raisePanel
  //**************************************************************************
    this.raisePanel = function(name){
        landingPage.hide();

        for (var key in panel) {
            if (key!==name) panel[key].body.hide();
            panel[key].button.className =
            panel[key].button.className.replace(" selected","").trim();
        }

        var p = panel[name];
        p.body.show();
        if (!p.app){
            var cls = eval(p.className);
            if (cls){
                mainPanel.appendChild(p.body);
                p.app = new cls(p.body, p.config);
                if (p.app.update) p.app.update();
            }
        }
        p.button.className += " selected";
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
    var createPanel = function(name, icon, className, config){
        var button = createElement("div", sidebar, icon + " noselect");
        button.onclick = function(){
            me.raisePanel(name);
        };

        var body = createElement("div", {
            height: "100%"
        });
        addShowHide(body);
        body.hide();


        panel[name] = {
           button: button,
           body: body,
           className: className,
           config: config,
           app: null
        };

    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;

    init();
};