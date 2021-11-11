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
    var reportList, menu;
    var accountDetails, pieChart, barGraph, transactionsPanel; //panels
    var accounts, vendors, sources, sourceAccounts, accountStats; //DataStores
    var transactionEditor; //window
    var spacing = 30; //panel spacing


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;


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
        mainDiv = document.createElement("div");
        mainDiv.style.height = "100%";
        parent.appendChild(mainDiv);
        me.el = mainDiv;



      //Create container for reports
        reportList = document.createElement("div");
        reportList.style.height = "100%";
        mainDiv.appendChild(reportList);
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
        var div = document.createElement("div");
        div.className = "report-preview";
        div.innerHTML = account.name + " Account";
        div.account = account;
        div.onclick = function(){
            var account = this.account;
            reportList.hide(function(){
                showReport(account);
            });
        };
        reportList.appendChild(div);
    };


  //**************************************************************************
  //** showReport
  //**************************************************************************
    var showReport = function(account){

        get("report/DistinctYears?accountID=" + account.id, {
            success: function(text){
                var years = JSON.parse(text);
                var year = years.length>0 ? years[0] : new Date().getFullYear();


                getAccountSummary(account, year, function(income, expenses){
                    renderAccountSummary(income, expenses, account, year, years.length==1 ? "montlyAvg" : "prevYear");
                    accountDetails.years = years;

                    setTimeout(function(){
                        if (!pieChart) createPieChart(mainDiv);
                        var h = (accountDetails.getHeight()/2)-spacing;
                        if (h<280) h = 280;
                        pieChart.setHeight(h);
                        pieChart.showAt(accountDetails.getWidth()+(spacing*2), spacing);
                        pieChart.update(expenses);


                    },200);

                });
            }
        });
    };


  //**************************************************************************
  //** getAccountSummary
  //**************************************************************************
    var getAccountSummary = function(account, year, callback){
        var startDate = moment.tz(year + "-01-01 00:00", config.timezone).toISOString();
        var endDate = moment.tz((year+1) + "-01-01 00:00", config.timezone).toISOString();
        get("report/AccountSummary?accountID=" + account.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                var json = JSON.parse(text);
                var income = json.income;
                var expenses = json.expenses;
                if (callback) callback.apply(me, [income, expenses]);
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** renderAccountSummary
  //**************************************************************************
  /** Used to render income and expenses for a given account
   */
    var renderAccountSummary = function(income, expenses, account, year, type){

        if (!accountDetails){
            accountDetails = createPanel(mainDiv, {
                onClose: function(){
                    if (transactionsPanel) transactionsPanel.hide();
                    if (pieChart) pieChart.hide();
                    if (barGraph) barGraph.hide();
                    accountDetails.hide();
                    reportList.show();
                }
            });

            var setSubTitle = accountDetails.setSubTitle;
            accountDetails.setSubTitle = function(text){
                setSubTitle("");
                var subtitle = document.createElement("div");
                subtitle.className = "report-subtitle";
                subtitle.style.display = "inline-block";
                subtitle.onclick = function(e){
                    var rect = javaxt.dhtml.utils.getRect(this);
                    var x = rect.x + rect.width + 10;
                    var y = rect.y + (rect.height/2);
                    if (!menu) menu = createMenu();
                    menu.showAt(x, y, "right", "middle");
                };
                subtitle.innerText = text;
                setSubTitle(subtitle);
            };
        }


        accountDetails.account = account;
        accountDetails.year = year;
        accountDetails.type = type;

        var comparePreviousYear = (type==="prevYear");


        accountDetails.clear();
        accountDetails.setTitle(account.name + " Account");
        accountDetails.setSubTitle( (comparePreviousYear?((year-1)+"-") : "") + year);


      //Create table
        var table = createTable();
        table.style.height = "";
        var tbody = table.firstChild;
        var tr, td;
        var rows = [];


      //Watch for up/down key events
        tbody.tabIndex = -1;
        tbody.onmouseover = function(){
            this.focus();
        };
        tbody.addEventListener("keyup", function(e){
            var up = (e.keyCode===38);
            var down = (e.keyCode===40);
            if (up || down){
                for (var i=0; i<rows.length; i++){
                    var row = rows[i];
                    if (row.className.indexOf("report-row-selected")>-1){
                        if (down && i<rows.length-1) rows[i+1].click();
                        if (up && i>0) rows[i-1].click();
                        break;
                    }
                }
            }
        });


      //Create "phantom" header row to set up spacing
        tr = document.createElement("tr");
        tr.style.height = "1px";
        tbody.appendChild(tr);
        var numColumns = 3;
        for (var i=0; i<numColumns; i++){
            td = document.createElement("td");
            td.style.width = "125px";
            tr.appendChild(td);
        }
        tr.childNodes[0].style.width = "100%";


        var addHeader = function(title, col1, col2){
            tr = document.createElement("tr");
            tbody.appendChild(tr);
            td = document.createElement("td");
            td.className = "report-section-header";
            //if (!addColHeader) td.colSpan = numColumns;
            td.innerHTML = title;
            tr.appendChild(td);


            td = document.createElement("td");
            td.className = "report-section-header report-column-header";
            if (col1) td.innerHTML = col1;
            tr.appendChild(td);

            td = document.createElement("td");
            td.className = "report-section-header report-column-header";
            if (col2) td.innerHTML = col2;
            tr.appendChild(td);

        };

        var updateTotals = function(isExpense){
            var total = 0;
            var prevYear = 0;
            for (var i=0; i<rows.length; i++){
                var cat = rows[i].category;
                var idx = rows[i].className.indexOf(" hidden");
                if (idx===-1){
                    if (cat.name){
                        if (isExpense && cat.isExpense){
                            total+=cat.total;
                            prevYear+=cat.prevYear;
                        }
                        if (!isExpense && !cat.isExpense){
                            total+=cat.total;
                            prevYear+=cat.prevYear;
                        }
                    }
                    else{ //found footer
                        var cols = rows[i].childNodes;
                        if (isExpense && cat.isExpense){
                            cols[1].innerHTML = formatCurrency(comparePreviousYear ? prevYear : total/12);
                            cols[2].innerHTML = formatCurrency(total);
                        }
                        if (!isExpense && !cat.isExpense){
                            cols[1].innerHTML = formatCurrency(comparePreviousYear ? prevYear : total/12);
                            cols[2].innerHTML = formatCurrency(total);
                        }
                    }
                }
            }
        };


        var onClick = function(row){
            row.className += " report-row-selected";

            var excludedCategories = [];
            for (var i=0; i<rows.length; i++){
                var idx = rows[i].className.indexOf(" hidden");
                if (idx>0) excludedCategories.push(rows[i].category.id);
            }

            showDetails(row.category, account, year, excludedCategories);
        };


        var addRow = function(category){
            var isFooter = false;
            if (!category.name) isFooter = true;
            tr = document.createElement("tr");
            tr.className = "report-row" + (isFooter? "-footer" : "");
            tr.category = category;
            tr.onclick = function(e){

              //Deselect previous selection
                for (var i=0; i<rows.length; i++){
                    var idx = rows[i].className.indexOf(" report-row-selected");
                    if (idx>0) rows[i].className = rows[i].className.substring(0, idx);
                }


              //Process click event
                if (isFooter){
                    onClick(this);
                }
                else{

                  //Use double click events to show/hide rows
                    if (e.detail === 2) { //double click
                        var idx = this.className.indexOf(" hidden");
                        if (idx>0){
                            this.className = this.className.substring(0, idx);
                                if (transactionsPanel) transactionsPanel.hide();
                                if (barGraph) barGraph.hide();
                        }
                        else{
                            this.className += " hidden";
                        }
                        updateTotals(this.category.isExpense);
                    }
                    else{ //single click, possibly followed by another click
                        var row = this;
                        setTimeout(function(){
                            var idx = row.className.indexOf(" hidden");
                            if (idx===-1) onClick(row);
                        }, 400);
                    }
                }
            };
            tbody.appendChild(tr);

            var cls = "report-cell" + (isFooter? "-footer" : "");
            td = document.createElement("td");
            td.className = cls;
            if (!isFooter) td.innerHTML = category.name;
            tr.appendChild(td);

            td = document.createElement("td");
            td.className = cls;
            td.style.textAlign = "right";
            td.innerHTML = formatCurrency(comparePreviousYear ? category.prevYear : category.total/12);
            tr.appendChild(td);

            td = document.createElement("td");
            td.className = cls;
            td.style.textAlign = "right";
            td.innerHTML = formatCurrency(category.total);
            tr.appendChild(td);
            rows.push(tr);
        };


        accountDetails.select = function(category){
            for (var i=0; i<rows.length; i++){
                if (rows[i].category.id===category.id){
                    rows[i].click();
                    break;
                }
            }
        };




        getAccountSummary(account, year-1, function(income2, expenses2){

          //Update income records
            for (var i=0; i<income.length; i++){income[i].prevYear=0;}
            for (var i=0; i<income2.length; i++){
                var addRecord = true;
                for (var j=0; j<income.length; j++){
                    if (income[j].name===income2[i].name){
                        addRecord = false;
                        income[j].prevYear = income2[i].total;
                        break;
                    }
                }
                if (addRecord){
                    var inc = income2[i];
                    inc.prevYear = inc.total;
                    inc.total = 0;
                    income.push(inc);
                }
            }


          //Update expense records
            for (var i=0; i<expenses.length; i++){expenses[i].prevYear=0;}
            for (var i=0; i<expenses2.length; i++){
                var addRecord = true;
                for (var j=0; j<expenses.length; j++){
                    if (expenses[j].name===expenses2[i].name){
                        addRecord = false;
                        expenses[j].prevYear = expenses2[i].total;
                        break;
                    }
                }
                if (addRecord){
                    var expense = expenses2[i];
                    expense.prevYear = expense.total;
                    expense.total = 0;
                    expenses.push(expense);
                }
            }


          //Render income
            if (comparePreviousYear){
                addHeader("Income", (year-1), year);
            }
            else{
                addHeader("Income", "Monthly Avg", "YTD Total");
            }
            var totalIncome = 0;
            var prevIncome = 0;
            income.sort(function(a, b){return b.total - a.total;});
            for (var i=0; i<income.length; i++){
                var category = income[i];
                totalIncome+=category.total;
                prevIncome+=category.prevYear;
                addRow(category);
            }
            addRow({
                name: false,
                total: totalIncome,
                prevYear: prevIncome
            });


          //Render expenses
            addHeader("Expenses");
            var totalExpenses = 0;
            var prevExpenses = 0;
            for (var i=0; i<expenses.length; i++){
                var expense = expenses[i];
                totalExpenses+=expense.total;
                prevExpenses+=expense.prevYear;
                expense.isExpense = true;
                addRow(expense);
            }
            addRow({
                name: false,
                total: totalExpenses,
                prevYear: prevExpenses,
                isExpense: true
            });


            accountDetails.update(table);
            accountDetails.showAt(spacing, spacing);

        });

    };


  //**************************************************************************
  //** createPieChart
  //**************************************************************************
    var createPieChart = function(parent){
        pieChart = createPanel(parent, {
            title: "Expense Summary",
            closable: false,
            width: "475px"
        });
        pieChart.getBody().style.padding = "15px 10px 0px 10px";
        var div = document.createElement("div");
        div.style.height = "100%";
        var canvas = createCanvas(div, {
            width: "250px",
            height: "250px"
        });
        var chart = createDoughnut(canvas, {cutout: 60});
        var legend = addLegend(canvas);
        pieChart.update(div);
        pieChart.update = function(expenses){
            legend.clear();

            var dataset = chart.data.datasets[0];
            dataset.data = [];


            for (var i=0; i<expenses.length; i++){
                //var name = expenses[i].name;
                var val = expenses[i].total;
                if (val<0) dataset.data.push(-val);
            }


            dataset.backgroundColor = [];
            dataset.borderWidth = [];
            var colorIndex = 0;
            var colors = javaxt.express.finance.style.colors;
            for (var i=0; i<dataset.data.length; i++){
                var color = colors[colorIndex];
                colorIndex++;
                if (colorIndex===dataset.data.length) colorIndex=0;
                dataset.backgroundColor.push(color);
                dataset.borderWidth.push(0);

                if (i<=colors.length){
                    var name = expenses[i].name;
                    if (i===colors.length){
                        name = "Other";
                        color = "#e5e5e5";
                    }
                    legend.addItem(name, color);
                }
            }
            dataset.hoverBackgroundColor = dataset.backgroundColor;

            chart.update();
        };
    };


  //**************************************************************************
  //** createBarGraph
  //**************************************************************************
    var createBarGraph = function(parent){

      //Create panel
        barGraph = createPanel(parent, {
            title: "Monthly Expenses",
            closable: false,
            width: "475px",
            height: "285px"
        });


      //Create canvas
        var canvas = createCanvas(barGraph.getBody());
        onRender(canvas, function(){
            barGraph.setHeight(barGraph.getHeight()+5);
        });


      //Create chart
        var chart = createBargraph(canvas, {});

      //Create function to update chart
        barGraph.update = function(monthlyTotals, category){
            barGraph.setSubTitle("");

          //Create datasets
            var datasets = [];
            for (var key in monthlyTotals) {
                if (monthlyTotals.hasOwnProperty(key)){
                    var arr = [];
                    if (category.isExpense===true){
                        var expenses = monthlyTotals[key].expenses;
                        for (var i=0; i<expenses.length; i++){
                            arr.push(-expenses[i]);
                        }
                    }
                    else{
                        var income = monthlyTotals[key].income;
                        for (var i=0; i<income.length; i++){
                            arr.push(income[i]);
                        }
                    }
                    datasets.push({
                        label: key, //year
                        backgroundColor: "blue",
                        data: arr
                    });
                }
            }


          //Set colors
            var colorRange = []; //ending with current year
            if (category.isExpense===true){
                colorRange = ['#c7baba','#FF3C38']; //redish gray, red
            }
            else{
                colorRange = ['#BEBCC1','#008000']; //gray, green
            }
            var colorScale = chroma.scale(colorRange);
            var colors = {};
            for (var i=0; i<datasets.length; i++){
                var p = i/(datasets.length-1);
                var color = colorScale(p).css();
                datasets[i].backgroundColor = color;
                colors[datasets[i].label + ""] = color;
            }


          //Update subtitle with legend
            var legend = document.createElement("div");
            legend.style.display = "inline-block";
            legend.style.marginTop = "5px";
            for (var i=0; i<datasets.length; i++){
                var label = datasets[i].label + "";
                var color = colors[label];
                var icon = document.createElement("div");
                icon.className = "chart-legend-circle noselect";
                icon.style.width = "10px";
                icon.style.height = "10px";
                icon.style.backgroundColor = color;
                if (i>0) icon.style.marginLeft = "15px";
                legend.appendChild(icon);
                var text = document.createElement("div");
                text.className = "chart-legend-label noselect";
                text.style.lineHeight = "16px";
                text.innerText = label;
                legend.appendChild(text);
            }
            barGraph.setSubTitle(legend);



            for (var key in monthlyTotals) {
                if (monthlyTotals.hasOwnProperty(key)){
                    var arr = [];
                    if (category.isExpense===true){
                        var expenses = monthlyTotals[key].expenses;
                        for (var i=0; i<expenses.length; i++){
                            var val = -expenses[i];
                            var prevVal = i>0 ? arr[i-1] : 0;
                            arr.push(val+prevVal);
                        }
                    }
                    else{
                        var income = monthlyTotals[key].income;
                        for (var i=0; i<income.length; i++){
                            var val = income[i];
                            var prevVal = i>0 ? arr[i-1] : 0;
                            arr.push(val+prevVal);
                        }
                    }
                    datasets.push({
                        label: key, //year
                        data: arr,
                        type: 'line',
                        fill: false,
                        borderColor: colors[key],
                        // this dataset is drawn on top
                        order: 2
                    });
                }
            }



          //Update chart
            chart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            chart.data.datasets = datasets;
            chart.update();
        };
    };


  //**************************************************************************
  //** createTransactionPanel
  //**************************************************************************
    var createTransactionPanel = function(parent){

      //Create panel
        transactionsPanel = createPanel(parent, {
            width: "600px",
            height: "640px",
            onClose: function(){
                //console.log("Update charts!");
            },
            style: {
                body: {
                    padding: "0 0 5px 0",
                    verticalAlign: "top"
                }
            }
        });


      //Create table with 2 rows
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.className = "panel-toolbar";
        tr.appendChild(td);
        var toolbar = document.createElement('div');
        td.appendChild(toolbar);

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);


      //Create data table/grid
        var columns = [
            {
                header: "ID",
                hidden: true
            },
            {
                header: "Date",
                width: 85,
                align: "right"
            },
            {
                header: "Source",
                width: 120
            },
            {
                header: "Description",
                width: "100%"
            },
            {
                header: "Amount",
                width: 100,
                align: "right"
            }
        ];
        var grid = new javaxt.dhtml.Table(td, {
            style: config.style.table,
            columns: columns
        });
        var currSelection = null;
        grid.onSelectionChange = function(rows){
            currSelection = null;
            for (var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row.selected){
                    editButton.enable();
                    var transactionID = parseInt(row.get(0));
                    currSelection = transactionID;
                    break;
                }
            }
        };


      //Append table and refactor the update method
        transactionsPanel.update(table);
        transactionsPanel.update = function(arr){
            grid.addRows(arr);
        };

        transactionsPanel.clear = function(){
            grid.clear();
        };



      //Add toolbar buttons
        var isMobile = false;

        var editButton = createButton(toolbar, {
            label: "Edit",
            icon: "editIcon",
            disabled: true
        });
        editButton.onClick = function(){
            if (currSelection) editTransaction(currSelection);
        };

        var downloadButton = createButton(toolbar, {
            label: "Download",
            icon: "downloadIcon",
            hidden: isMobile
        });
        var link;
        downloadButton.onClick = function(){

          //Create csv
            var csvContent = "data:text/csv;charset=utf-8,";

          //Add csv header
            for (var i=0; i<columns.length; i++){
                if (i>0) csvContent += ",";
                csvContent += columns[i].header;
            }
            csvContent += "\r\n";


          //Add csv data
            grid.forEachRow(function (row, content) {
                var row = "";
                for (var i=0; i<content.length; i++){
                    if (i>0) row += ",";
                    var cell = content[i];
                    if (!(typeof cell === "string")){
                        cell = cell.innerText;
                    }
                    if (cell.indexOf(",")>-1 || cell.indexOf("\n")>-1){
                        cell = "\"" + cell + "\"";
                    }
                    cell = cell.replace("#",""); //TODO: find proper way to encode characters like this
                    row += cell;
                }
                csvContent += row + "\r\n";
            });


            var encodedUri = encodeURI(csvContent);
            if (!link){
                link = document.createElement("a");
                document.body.appendChild(link);
            }
            var title = transactionsPanel.getTitle();
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", title + ".csv");
            link.click();
        };
    };


  //**************************************************************************
  //** showDetails
  //**************************************************************************
    var showDetails = function(category, account, year, excludedCategoryIDs){

        if (isNaN(category.id)){ //no specific category selected, show summary

            if (transactionsPanel) transactionsPanel.hide();
            var url = "report/MonthlyTotals?accountID=" + account.id + "&year=" + year + "-" + (year-1);
            if (excludedCategoryIDs){
                excludedCategoryIDs = excludedCategoryIDs.join();
                if (excludedCategoryIDs.length) url += "&exclude=" + excludedCategoryIDs;
            }
            get(url, {
                success: function(text){
                    var monthlyTotals = JSON.parse(text);
                    updateBarGraph(category, monthlyTotals);

                },
                failure: function(request){
                    alert(request);
                }
            });
        }
        else{ //show details for selected category

            if (transactionsPanel){
                transactionsPanel.setTitle("");
                transactionsPanel.clear();
            }

            var startDate = moment.tz((year-1) + "-01-01 00:00", config.timezone).toISOString();
            var endDate = moment.tz((year+1) + "-01-01 00:00", config.timezone).toISOString();


            var fields = "id,date,description,amount,categoryID,sourceID";
            var where = "category_id=" + category.id + " and (date>='" + startDate + "' and date<'" + endDate + "')";
            var orderBy = "date desc";
            var url = "transactions?where=" + encodeURIComponent(where) + "&fields=" + fields +
                "&orderBy=" + encodeURIComponent(orderBy) + "&limit=100000";

            get(url, {
                success: function(text, xml, url, request){

                  //Get records and monthly totals
                    var records = [];
                    var monthlyTotals = {};
                    var transactions = normalizeResponse(request);
                    for (var i=0; i<transactions.length; i++){
                        var transaction = transactions[i];
                        var id = transaction.id;
                        var date = transaction.date;
                        var desc = transaction.description;
                        var amount = transaction.amount;
                        var sourceID = transaction.sourceID;

                        var m = moment.tz(date, config.timezone);
                        if (m.year()===year){
                            records.push([
                                id,
                                createCell("date", m, config.dateFormat),
                                createCell("source", findSource(sourceID)),
                                desc,
                                createCell("currency", amount)
                            ]);
                        }

                        var key = m.year()+"";
                        var json = monthlyTotals[key];
                        if (!json){
                            json = {
                                income: [0,0,0,0,0,0,0,0,0,0,0,0],
                                expenses: [0,0,0,0,0,0,0,0,0,0,0,0]
                            };
                            monthlyTotals[key] = json;
                        }

                        if (category.isExpense===true){
                            monthlyTotals[key].expenses[m.month()]+= amount;
                        }
                        else{
                            monthlyTotals[key].income[m.month()]+= amount;
                        }
                    }


                  //Update transactionsPanel
                    if (!transactionsPanel) createTransactionPanel(mainDiv);
                    transactionsPanel.clear();
                    transactionsPanel.setTitle(category.name);
                    transactionsPanel.update(records);
                    var xOffset = accountDetails.getWidth()+(spacing*2);
                    if (!transactionsPanel.isOpen()){
                        var x = xOffset;
                        if (pieChart){ //and is pieChart in default position...
                            x += pieChart.getWidth()+spacing;
                        }
                        transactionsPanel.showAt(x, spacing);
                    }


                  //Update barGraph
                    updateBarGraph(category, monthlyTotals, xOffset);

                },
                failure: function(request){
                    alert(request);
                }
            });
        }
    };


  //**************************************************************************
  //** updateBarGraph
  //**************************************************************************
    var updateBarGraph = function(category, monthlyTotals, xOffset){
        if (!barGraph) createBarGraph(mainDiv);
        var title;
        if (category.name){
            title = category.name;
        }
        else{
            if (category.isExpense===true){
                title = "Total Expenses";
            }
            else{
                title = "Total Revenue";
            }
        }
        barGraph.setTitle(title);
        barGraph.update(monthlyTotals, category);
        if (!barGraph.isOpen()){
            if (isNaN(xOffset)) xOffset = accountDetails.getWidth()+(spacing*2);
            barGraph.showAt(xOffset, pieChart.getHeight()+(spacing*2));
            barGraph.show();
        }
    };


  //**************************************************************************
  //** editTransaction
  //**************************************************************************
    var editTransaction = function(transactionID){


      //Instantiate transaction editor as needed
        if (!transactionEditor){
            transactionEditor = new javaxt.express.finance.TransactionEditor({
                accounts: accounts,
                style: javaxt.express.finance.style
            });
        }


      //Clear/reset the form
        transactionEditor.clear();


      //Get transaction and open editor
        get("transaction/"+transactionID, {
            success: function(text){
                var transaction = JSON.parse(text);
                var category = transaction.category;
                var account = category.account;

                transactionEditor.setTitle("Edit Transaction");
                transactionEditor.setValue("id", transaction.id);
                transactionEditor.setValue("categoryID", category.id);
                transactionEditor.show();


                transactionEditor.onSubmit = function(){
                    var transaction = transactionEditor.getValues();
                    transactionEditor.close();
                    get("linkTransaction/" + transaction.id + "?categoryID="+ transaction.categoryID,  {
                        success: function(){

                          //Refresh panels
                            showReport(account);


                          //Select category
                            accountDetails.select(category);


                          //Update account stats
                            if (accountStats){

                                var newAccount;
                                for (var i=0; i<accounts.length; i++){
                                    var rec = accounts.get(i);
                                    if (rec.id===transaction.accountID){
                                        newAccount = rec;
                                        break;
                                    }
                                }

                                for (var i=0; i<accountStats.length; i++){
                                    var record = accountStats.get(i);
                                    if (record.name===newAccount.name){
                                        record.count += 1;
                                        accountStats.set(i, record);
                                    }
                                    if (record.name===account.name){
                                        record.count -= 1;
                                        accountStats.set(i, record);
                                    }
                                }
                            }

                        }
                    });
                };
            }
        });
    };



  //**************************************************************************
  //** createMenu
  //**************************************************************************
    var createMenu = function(){
        var body = document.getElementsByTagName("body")[0];
        var callout = new javaxt.dhtml.Callout(body, {
            style: {
                panel: "callout-panel",
                arrow: "callout-arrow"
            }
        });

        var innerDiv = callout.getInnerDiv();
        var contentDiv = document.createElement("div");
        contentDiv.style.padding = "5px";
        innerDiv.appendChild(contentDiv);


        var form = new javaxt.dhtml.Form(contentDiv, {
            style: config.style.form,
            items: [
                {
                    name: "year",
                    label: "Year",
                    type: createComboBox({
                        style: config.style.combobox,
                        scrollbar: true
                    })
                },
                {
                    name: "type",
                    label: "Columns",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "Show Montly Average",
                            value: "montlyAvg"
                        },
                        {
                            label: "Compare Previous Year",
                            value: "prevYear"
                        }
                    ]
                }
            ],
            buttons: [
                {
                    name: "Update",
                    onclick: function(){
                        var year = parseInt(form.getValue("year"));
                        var type = form.getValue("type");
                        var account = accountDetails.account;
                        getAccountSummary(account, year, function(income, expenses){
                            renderAccountSummary(income, expenses, account, year, type);
                        });

                        menu.hide();
                    }
                }
            ]
        });


        callout.onShow = function(){

          //Update type
            if (accountDetails.type){
                form.setValue("type", accountDetails.type);
            }
            else{
                form.setValue("type", "montlyAvg");
            }


          //Update year
            var year = form.findField("year");
            year.clear();
            var arr = accountDetails.years;
            if (arr){
                for (var i=0; i<arr.length; i++){
                    year.add(arr[i]);
                }

                if (accountDetails.year){
                    year.setValue(accountDetails.year);
                }
                else {
                    if (arr.length>0) year.setValue(arr[0]);
                }
            }
        };

        return callout;
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
  /** Returns a custom window used to render charts, graphs, etc
   */
    var createPanel = function(parent, options){

      //Create table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Subtitle
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.textAlign = "center";
        tr.appendChild(td);
        var subtitle = td;


      //Body
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        var body = td;


        var style = merge({}, config.style.window);
        style.header += " report-header";
        style.title += " report-title";
        style.button += " report-header-button";
        style.body = "report-body";
        if (options.style){
            if (options.style.body){
                style.body = options.style.body;
            }
        }

        var panel = new javaxt.dhtml.Window(parent, {
            title: options.title,
            width: options.width,
            height: options.height,
            style: style
        });
        panel.getBody().appendChild(table);

        panel.onClose = function(){
            if (options.onClose) options.onClose();
        };

        panel.clear = function(){
            panel.setTitle("");
            subtitle.innerHTML = "";
            body.innerHTML = "";
        };

        panel.setSubTitle = function(content){
            if (typeof content === "string"){
                subtitle.innerHTML = content;
            }
            else{
                subtitle.appendChild(content);
            }
        };

        panel.update = function(content){
            if (typeof content === "string"){
                body.innerHTML = content;
            }
            else{
                body.appendChild(content);
            }
        };

        panel.getBody = function(){
            return body;
        };

        return panel;
    };


  //**************************************************************************
  //** createComboBox
  //**************************************************************************
    var createComboBox = function(comboboxConfig){
        return new javaxt.dhtml.ComboBox(document.createElement("div"), comboboxConfig);
    };


  //**************************************************************************
  //** createCanvas
  //**************************************************************************
    var createCanvas = function(parent, style){

        var width, height;
        if (style){
            width = style.width;
            height = style.height;
        }

      //Create main div
        var outerDiv = document.createElement("div");
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.overflow = "hidden";
        parent.appendChild(outerDiv);


      //Create inner div
        var innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.width = width ? width : "100%";
        innerDiv.style.height = height ? height : "100%";
        outerDiv.appendChild(innerDiv);


      //Create canvas
        var canvas = document.createElement('canvas');
        if (width && height){
            var w = parseInt(width);
            var h = parseInt(height);
            canvas.style.width = w+"px";
            canvas.style.height = h+"px";
            canvas.width = w;
            canvas.height = h;
        }
        canvas.clear = function(){
            var ctx = this.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
        };
        innerDiv.appendChild(canvas);


        return canvas;
    };


  //**************************************************************************
  //** findSource
  //**************************************************************************
    var findSource = function(sourceID){
        return javaxt.express.finance.utils.findSource(sourceID, vendors, sources, sourceAccounts);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;
    var createCell = javaxt.express.finance.utils.createCell;
    var createButton = javaxt.express.finance.utils.createButton;

    var createDoughnut = javaxt.express.finance.utils.createDoughnut;
    var createBargraph = javaxt.express.finance.utils.createBargraph;
    var addLegend = javaxt.express.finance.utils.addLegend;

    var formatCurrency = javaxt.express.finance.utils.formatCurrency;
    var getMomentFormat = javaxt.express.finance.utils.getMomentFormat;

    var getSources = javaxt.express.finance.utils.getSources;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var normalizeResponse = javaxt.express.finance.utils.normalizeResponse;

    init();

};