if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  Application
//******************************************************************************
/**
 *   Primary user interface for the app.
 *
 ******************************************************************************/

javaxt.express.finance.Application = function(parent, config) {

    var me = this;
    var carousel;
    var fx = new javaxt.dhtml.Effects();

    var nav;
    var apps = [];
    var sliding = false;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Create header nav
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        createHeader(td);



      //Create body
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createBody(td);


      //Create footer
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        createFooter(td);


      //Check whether the table has been added to the DOM
        var w = table.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = table.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    onRender();
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            onRender();
        }


        parent.appendChild(table);
        me.el = table;
    };


  //**************************************************************************
  //** onRender
  //**************************************************************************
    var onRender = function(){

      //Render carousel
        carousel.resize();


      //Select dashboard app as default view
        var dashboard = apps[1];
        dashboard.li.select();


      //Initialize dashboard app
        var panels = carousel.getPanels();
        for (var i=0; i<panels.length; i++){
            var panel = panels[i];
            if (panel.isVisible){
                panel.div.appendChild(dashboard.div);
                initApp(dashboard, panel.div);
                break;
            }
        }


      //Watch for drag and drop events
        parent.addEventListener('dragover', onDragOver, false);
        parent.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();

          //Get files
            var files = e.dataTransfer.files;


          //Select transactions app
            var transactions = apps[1];
            transactions.li.select();


          //Define function to import files
            var importData = function(){
                for (var i=0; i<files.length; i++) {
                    var file = files[i];
                    transactions.instance.import(file);
                }
            };


          //Wait for the transaction app to initialize
            if (!transactions.instance){
                var timer;

                var checkInstance = function(){
                    if (!transactions.instance){
                        timer = setTimeout(checkInstance, 500);
                    }
                    else{
                        clearTimeout(timer);
                        importData();
                    }
                };

                timer = setTimeout(checkInstance, 500);
            }
            else{
                importData();
            }

        }, false);


    };


  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(parent){

      //Create table with three columns
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tr.className = "header";
        tbody.appendChild(tr);
        var td;


      //Create logo in column 1
        td = document.createElement("td");
        tr.appendChild(td);
        var logo = document.createElement("div");
        logo.className = "header-logo";
        td.appendChild(logo);


      //Create nav in column 2
        td = document.createElement("td");
        td.style.width = "100%";
        tr.appendChild(td);
        nav = document.createElement("ul");
        nav.className = "header-nav";
        td.appendChild(nav);



      //Create placeholder for settings in column 3
        td = document.createElement("td");
        tr.appendChild(td);


        parent.appendChild(table);
    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){


      //Create carousel
        carousel = new javaxt.dhtml.Carousel(parent, {
            drag: false, //should be true if touchscreen
            loop: true,
            animate: true,
            animationSteps: 600,
            transitionEffect: "easeInOutCubic",
            fx: fx
        });


      //Add panels to the carousel
        var currPanel = document.createElement('div');
        currPanel.style.height = "100%";
        carousel.add(currPanel);

        var nextPanel = currPanel.cloneNode(false);
        carousel.add(nextPanel);

        var prevPanel = currPanel.cloneNode(false);
        carousel.add(prevPanel);


      //Add event handlers
        carousel.beforeChange = function(){
            sliding = true;
        };
        carousel.onChange = function(currPanel, prevPanel){


          //Initialize app as needed
            for (var i=0; i<apps.length; i++){
                var li = apps[i].li;
                if (li.selected){
                    initApp(apps[i], currPanel);
                    break;
                }
            }

            sliding = false;
        };


      //Create apps
        createApp("Dashboard", javaxt.express.finance.Dashboard);
        createApp("Transactions", javaxt.express.finance.Transactions, "aliceblue");
        createApp("Reports", javaxt.express.finance.Reports, "#75bdbd");
        createApp("Invoices", javaxt.express.finance.Invoices, "bisque");
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
    var createApp = function(label, appClass, color){


        var div = document.createElement("div");
        div.style.width = "100%";
        div.style.height = "100%";
        if (color) div.style.background = color;
        div.setAttribute("desc", label);


        var li = document.createElement("li");
        li.className = "header-link";
        li.tabIndex = -1; //allows the element to have focus
        li.innerHTML = label;
        li.select = function(){
            if (sliding){
                this.blur();
                return;
            }
            this.focus();


          //Find the selected menu item
            var idx = 0;
            var currSelection = -1;
            for (var i=0; i<nav.childNodes.length; i++){
                var li = nav.childNodes[i];
                if (li==this) idx = i;

                if (li.selected){
                    currSelection = i;
                    li.selected = false;
                    li.className = "header-link";
                }
            }


          //Update selected item and the carousel
            if (idx!=currSelection){

              //Update selection
                this.selected = true;
                this.className = "header-link header-link-selected";


              //If nothing was selected, then no need to continue
                if (currSelection==-1) return;


              //Find next panel and previous panel
                var nextPanel, prevPanel;
                var panels = carousel.getPanels();
                for (var i=0; i<panels.length; i++){
                    if (panels[i].isVisible){
                        if (i==0){
                            prevPanel = panels[panels.length-1];
                        }
                        else{
                            prevPanel = panels[i-1];
                        }
                        if (i==panels.length-1){
                            nextPanel = panels[0];
                        }
                        else{
                            nextPanel = panels[i+1];
                        }
                        break;
                    }
                }


              //Update panels
                if (currSelection<idx){
                    var el = prevPanel.div;
                    removeChild(el);
                    el.appendChild(apps[idx].div);
                    removeChild(nextPanel.div);
                    //console.log("slide right");
                    carousel.back();
                }
                else if (currSelection>idx){
                    var el = nextPanel.div;
                    removeChild(el);
                    el.appendChild(apps[idx].div);
                    removeChild(prevPanel.div);
                    //console.log("slide left");
                    carousel.next();
                }
            }
        };
        li.onclick = function(){
            this.select();
        };


        nav.appendChild(li);

        apps.push({
           li: li,
           div: div,
           cls: appClass,
           label: label
        });
    };



  //**************************************************************************
  //** initApp
  //**************************************************************************
    var initApp = function(app, panel){
        if (!app.instance){
            var div = panel.firstChild;
            app.instance = new app.cls(div, {});
        }
    };



  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){

    };


  //**************************************************************************
  //** removeChild
  //**************************************************************************
  /** Used to remove the first child from a carousel panel
   */
    var removeChild = function(el){
        if (el.childNodes.length>0){

          //Remove child
            var div = el.removeChild(el.childNodes[0]);

          //Update apps
            if (div.childNodes.length>0){
                var desc = div.getAttribute("desc");
                for (var j=0; j<apps.length; j++){
                    var app = apps[j];
                    if (app.div.getAttribute("desc")==desc){
                        app.div = div;
                        break;
                    }
                }
            }
        }
    };


  //**************************************************************************
  //** onDragOver
  //**************************************************************************
  /** Called when the client drags a file over the parent.
   */
    var onDragOver = function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createTable = javaxt.dhtml.utils.createTable;


    init();

};