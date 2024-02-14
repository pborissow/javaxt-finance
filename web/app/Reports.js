if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  Reports
//******************************************************************************
/**
 *   Panel used to render a list of reports
 *
 ******************************************************************************/

javaxt.express.finance.Reports = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style,
        dateFormat: "M/d/yyyy",
        timezone: "America/New_York"
    };
    var mainDiv;
    var reportList, reportEditor, accountDashboard;
    var accounts, vendors, sources, sourceAccounts, accountStats; //DataStores


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Get or create animation effects
        if (!config.fx) config.fx = new javaxt.dhtml.Effects();


      //Update timezone
        config.timezone = config.timezone.trim().replace(" ", "_");


      //Create main div
        mainDiv = createElement("div", parent, {
            height: "100%",
            position: "relative",
            backgroundColor: "#e2e2e2"
        });
        me.el = mainDiv;



      //Create container for reports
        reportList = createElement("div", mainDiv, {height: "100%"});
        reportList.show = function(callback){
            config.fx.fadeIn(this, "easeInOutCubic", 600, callback);
        };
        reportList.hide = function(callback){
            config.fx.fadeOut(this, "easeInOutCubic", 600, callback);
        };




        getSources(orgConfig, function(){
            vendors = orgConfig.vendors;
            sources = orgConfig.sources;
            sourceAccounts = orgConfig.sourceAccounts;
        });


      //Get accounts and create reports
        getAccounts(orgConfig, function(){
            accounts = orgConfig.accounts;
            for (var i=0; i<accounts.length; i++){
                var account = accounts.get(i);
                addReport(account);
            }
            addNewReportOption();

            accounts.addEventListener("add", function(account){
                addReport(account);
            }, me);

            accounts.addEventListener("remove", function(account){
                var div = getReport(account);
                if (div) reportList.removeChild(div);
            }, me);

            accounts.addEventListener("update", function(account){
                var div = getReport(account);
                if (div){
                    div.innerHTML = account.name + " Account";
                }
            }, me);
        });


        accountStats = orgConfig.stats.accounts;

    };


  //**************************************************************************
  //** getReport
  //**************************************************************************
    var getReport = function(account){
        for (var i=0; i<reportList.childNodes.length; i++){
            var div = reportList.childNodes[i];
            if (div.accountID===account.id){
                return div;
            }
        }
        return div;
    };


  //**************************************************************************
  //** addReport
  //**************************************************************************
    var addReport = function(account){

        var div = createElement("div", reportList, "report-preview");
        var table = createTable(div);
        var title = table.addRow().addColumn("title");
        createElement("div", title).innerHTML = account.name + " Account";

        var body = table.addRow().addColumn({
            height: "100%",
            textAlign: "center"
        });
        if (account.info && account.info.logo){
            var img = createElement('img', body);
            img.src = account.info.logo;
        }

        div.account = account;
        div.onclick = function(){
            var account = this.account;

            if (!accountDashboard){
                accountDashboard = new javaxt.express.finance.AccountDashboard(mainDiv, config);
                accountDashboard.onClose = function(){
                    reportList.show();
                    accountDashboard.hide();
                };
            }

            reportList.hide(function(){
                accountDashboard.update(account, {
                    accounts: accounts,
                    vendors: vendors,
                    sources: sources,
                    sourceAccounts: sourceAccounts,
                    accountStats: accountStats
                });
                accountDashboard.show();
            });
        };
    };


  //**************************************************************************
  //** addNewReportOption
  //**************************************************************************
    var addNewReportOption = function(){
        var div = createElement("div", reportList, "new-report");
        div.onclick = function(){
            if (!reportEditor){
                reportEditor = new javaxt.express.finance.ReportEditor(mainDiv, config);
                reportEditor.onClose = function(){
                    reportList.show();
                    reportEditor.hide();
                };
            }

            reportList.hide(function(){
                reportEditor.update();
                reportEditor.show();
            });
        };
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;

    var getSources = javaxt.express.finance.utils.getSources;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var normalizeResponse = javaxt.express.finance.utils.normalizeResponse;

    init();

};