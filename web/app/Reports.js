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
    var link;


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
        mainDiv = createElement("div", parent);
        mainDiv.style.height = "100%";
        me.el = mainDiv;



      //Create container for reports
        reportList = createElement("div", mainDiv);
        reportList.style.height = "100%";
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
        var div = createElement("div", reportList);
        div.className = "report-preview";
        div.innerHTML = account.name + " Account";
        div.account = account;
        div.onclick = function(){
            var account = this.account;
            reportList.hide(function(){
                showReport(account);
            });
        };
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
  //** getAccountSummaryByMonth
  //**************************************************************************
    var getAccountSummaryByMonth = function(account, year, callback){
        if (!callback) return;

        var income = [];
        var expenses = [];


      //Generate list of URLs to call
        var urls = [];
        for (var i=0; i<12; i++){
            var a = year + "-" + pad(i+1);
            var b = year + "-" + pad(i+2);
            if (i+2===13) b = (year+1) + "-01";


            var startDate = moment.tz(a + "-01 00:00", config.timezone).toISOString();
            var endDate = moment.tz(b + "-01 00:00", config.timezone).toISOString();
            var url = "report/AccountSummary?accountID=" + account.id +
                "&startDate=" + startDate + "&endDate=" + endDate;
            urls.push(url);
        }


      //Function used to fetch and update income and expenses by month
        var getData = function(){

          //If there are no more URLs to call, sort and return the income and expenses
            if (urls.length===0){

                income.forEach((r)=>{
                    r.total = 0;
                    r.months.forEach((t)=>{ r.total += t; });
                });

                expenses.forEach((r)=>{
                    r.total = 0;
                    r.months.forEach((t)=>{ r.total += t; });
                });

                income.sort((a, b)=>{
                    return (a.total>b.total) ? 1 : -1;
                });

                expenses.sort((a, b)=>{
                    return (a.total>b.total) ? 1 : -1;
                });

                callback.apply(me, [income, expenses]);
                return;
            }


          //Get next URL and update income and expenses
            get(urls.shift(), {
                success: function(text){
                    var json = JSON.parse(text);
                    var month = urls.length-12;


                  //Update income
                    json.income.forEach((r)=>{

                        var foundMatch = false;
                        for (var i=0; i<income.length; i++){
                            if (income[i].id===r.id){
                                income[i].months.push(r.total);
                                foundMatch = true;
                                break;
                            }
                        }

                        if (!foundMatch){
                            income.push({
                                id: r.id,
                                name: r.name,
                                months: [r.total]
                            });
                        }
                    });


                  //Update expenses
                    json.expenses.forEach((r)=>{

                        var foundMatch = false;
                        for (var i=0; i<expenses.length; i++){
                            if (expenses[i].id===r.id){
                                expenses[i].months.push(r.total);
                                foundMatch = true;
                                break;
                            }
                        }

                        if (!foundMatch){
                            expenses.push({
                                id: r.id,
                                name: r.name,
                                months: [r.total]
                            });
                        }
                    });


                    getData();
                },
                failure: function(request){
                    alert(request);
                }
            });
        };

      //Get income and expenses
        getData();

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
                },
                settings: true
            });

            var setSubTitle = accountDetails.setSubTitle;
            accountDetails.setSubTitle = function(text){
                setSubTitle("");
                var subtitle = createElement("div");
                subtitle.className = "report-subtitle";
                subtitle.style.display = "inline-block";
                subtitle.innerText = text;
                setSubTitle(subtitle);
            };

            accountDetails.settings.onclick = function(e){
                var rect = javaxt.dhtml.utils.getRect(this);
                var x = rect.x + rect.width-5;
                var y = rect.y + (rect.height/2);
                if (!menu) menu = createMenu();
                menu.showAt(x, y, "right", "middle");
            };


            var download = createElement("div", accountDetails.settings.parentNode);
            download.className = "report-download noselect";
            download.innerHTML = '<i class="fas fa-long-arrow-alt-down"></i>';

            download.onclick = function(){

              //Get income and expenses as seperate arrays
                var incomeRows = [];
                var expenseRows;
                var hasMonths = false;
                var rows = accountDetails.getBody().getElementsByTagName("tr");
                for (var i=0; i<rows.length; i++){
                    var row = rows[i];
                    if (row.className==="report-row"){
                        if (expenseRows) expenseRows.push(row);
                        else incomeRows.push(row);
                    }
                    if (row.className==="report-row-footer"){
                        if (expenseRows) break;
                        else expenseRows = [];
                    }
                    if (row.category){
                        if (row.category.months) hasMonths = true;
                    }
                }
                var data = {
                    "Income": incomeRows,
                    "Expenses": expenseRows
                };


              //Create csv
                var csvContent = "Type,Category";
                if (hasMonths) csvContent += ",Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec";
                csvContent += ",Total";

                for (var key in data) {
                    if (data.hasOwnProperty(key)){
                        var rows = data[key];

                        for (var i=0; i<rows.length; i++){
                            var row = rows[i];

                            var col = row.childNodes;
                            var name = col[0].innerText;
                            var total = col[col.length-1].innerText;

                            if (total!=="$0.00"){

                                csvContent += "\r\n";
                                csvContent += key + ",";

                                if (name.indexOf(",")>-1) name = "\"" + name + "\"";
                                csvContent += name + ",";

                                if (hasMonths){
                                    for (var j=0; j<12; j++){
                                        var v = col[j+1].innerText;
                                        if (v.length>0){
                                            if (v.indexOf(",")>-1) v = "\"" + v + "\"";
                                            csvContent += v;
                                        }
                                        csvContent += ",";
                                    }
                                }

                                if (total.indexOf(",")>-1) total = "\"" + total + "\"";
                                csvContent += total;
                            }

                        }
                    }
                }


              //Download csv
                downloadCSV(csvContent, "Income and Expenses");
            };
        }


        accountDetails.account = account;
        accountDetails.year = year;
        accountDetails.type = type;

        var comparePreviousYear = (type==="prevYear");


        accountDetails.clear();
        accountDetails.setTitle(account.name + " Account");
        accountDetails.setSubTitle( (comparePreviousYear?((year-1)+"-") : "") + year);



      //Calculate numMonths (used for monthly averages)
        var numMonths = 12;
        var currDate = new Date();
        if (accountDetails.year===currDate.getFullYear()){
            var currMonth = currDate.getMonth()+1;
            numMonths = currMonth-1;
            var currDay = currDate.getDate();
            var numDays = new Date(year, currMonth, 0).getDate();
            numMonths += currDay/numDays;
        }



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



        var numColumns = 0;
        var addHeader = function(title){
            if (!title) return;
            if (!numColumns && arguments.length<2) return;


          //Add "phantom" header row to set up spacing as needed
            if (!numColumns){
                numColumns = arguments.length-1;

                tr = table.addRow({ height: "1px" });
                for (var i=1; i<arguments.length; i++){
                    td = tr.addColumn({
                        width: i===0 ? "100%" : "125px"
                    });
                }
            }


          //Add section title
            tr = table.addRow();
            td = tr.addColumn("report-section-header");
            td.innerHTML = title;


          //Add column headers
            for (var i=0; i<numColumns; i++){
                td = tr.addColumn("report-section-header report-column-header");
                if (arguments[i+1]) td.innerHTML = arguments[i+1];
            }
        };



      //Function used to update totals when a user hides/unhides a row
        var updateTotals = function(isExpense){
            var total = 0;
            var prevYear = 0;

            var totalIncome = 0;
            var totalExpenses = 0;
            var prevIncome = 0;
            var prevExpenses = 0;



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


                        if (cat.isExpense){
                            totalExpenses+=cat.total;
                            prevExpenses+=cat.prevYear;
                        }
                        if (!cat.isExpense){
                            totalIncome+=cat.total;
                            prevIncome+=cat.prevYear;
                        }
                    }
                    else{ //found footer
                        var cols = rows[i].childNodes;
                        var n = cols.length-1;

                        var lastCol = "";
                        var prevCol = "";

                        if (cat.isExpense && cat.isRevenue){ //show net revenue (income-expenses)
                            var net = totalIncome+totalExpenses;
                            prevCol = formatCurrency(comparePreviousYear ? prevIncome+prevExpenses : net/numMonths);
                            lastCol = formatCurrency(net);
                        }
                        else{
                            if (isExpense && cat.isExpense){
                                prevCol = formatCurrency(comparePreviousYear ? prevYear : total/numMonths);
                                lastCol = formatCurrency(total);
                            }
                            if (!isExpense && !cat.isExpense){
                                prevCol = formatCurrency(comparePreviousYear ? prevYear : total/numMonths);
                                lastCol = formatCurrency(total);
                            }
                        }

                        if (type==="months"){

                        }
                        else{
                            cols[n-1].innerHTML = prevCol;
                        }

                        cols[n].innerHTML = lastCol;

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
            tr = table.addRow("report-row" + (isFooter? "-footer" : ""));
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


            var cls = "report-cell" + (isFooter? "-footer" : "");


          //Add category name
            td = tr.addColumn(cls);
            if (!isFooter) td.innerHTML = category.name;


          //Add middle column(s)
            if (type==="months"){
                for (var i=0; i<12; i++){
                    td = tr.addColumn(cls);
                    td.style.textAlign = "right";
                    if (category.months){
                        var v = category.months[i];
                        td.innerHTML = formatCurrency(v);
                    }
                }
            }
            else{
                td = tr.addColumn(cls);
                td.style.textAlign = "right";
                td.innerHTML = formatCurrency(comparePreviousYear ? category.prevYear : category.total/numMonths);
            }


          //Add total
            td = tr.addColumn(cls);
            td.style.textAlign = "right";
            td.innerHTML = formatCurrency(category.total);

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
            if (type==="months"){
                addHeader("Income", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total");
            }
            else{
                if (comparePreviousYear){
                    addHeader("Income", (year-1), year);
                }
                else{
                    addHeader("Income", "Monthly Avg",
                    accountDetails.year===currDate.getFullYear() ? "YTD Total" : accountDetails.year);
                }
            }

            var totalIncome = 0;
            var prevIncome = 0;
            income.sort(function(a, b){return b.total - a.total;});
            for (var i=0; i<income.length; i++){
                var category = income[i];
                category.isRevenue = true;
                category.isExpense = false;
                totalIncome+=category.total;
                prevIncome+=category.prevYear;
                addRow(category);
            }
            addRow({
                name: false,
                total: totalIncome,
                prevYear: prevIncome,
                isExpense: false,
                isRevenue: true
            });


          //Render expenses
            addHeader("Expenses");
            var totalExpenses = 0;
            var prevExpenses = 0;
            for (var i=0; i<expenses.length; i++){
                var expense = expenses[i];
                expense.isRevenue = false;
                expense.isExpense = true;
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


          //Render income-expenses
            addHeader("Bottom Line");
            addRow({
                name: false,
                total: totalIncome+totalExpenses,
                prevYear: prevIncome+prevExpenses,
                isExpense: true,
                isRevenue: true
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
        var div = createElement("div");
        div.style.height = "100%";
        var canvas = createCanvas(div, {
            width: "250px",
            height: "250px"
        });
        var chart = createDoughnut(canvas, {cutout: 60});
        var legend = addLegend(canvas);
        pieChart.update(div);
        pieChart.update = function(expenses){
            if (!expenses) return;
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
            if (!category) return;
            barGraph.setSubTitle("");

          //Create datasets
            var datasets = [];
            if (category.isRevenue===true && category.isExpense===true){ //render income vs expenses for the year

              //Create pseudo-datasets for the legend
                datasets.push({
                    label: "Expenses",
                    backgroundColor: "#c7baba"
                });
                datasets.push({
                    label: "Revenue",
                    backgroundColor: "#008000"
                });

            }
            else{ //show income or expense for current year vs prev year

              //Create datasets for the bar charts
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
            }


          //Set colors
            var colorRange = []; //ending with current year
            if (category.isExpense===true){
                colorRange = ['#c7baba','#FF3C38']; //redish gray, red
            }
            if (category.isRevenue===true){
                colorRange = ['#BEBCC1','#008000']; //gray, green
            }
            if (category.isExpense===true && category.isRevenue===true){
                colorRange = ['#c7baba','#008000']; //redish gray, green
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
            var legend = createElement("div");
            legend.style.display = "inline-block";
            legend.style.marginTop = "5px";
            for (var i=0; i<datasets.length; i++){
                var label = datasets[i].label + "";
                var color = colors[label];
                var icon = createElement("div", legend, "chart-legend-circle noselect");
                icon.style.width = "10px";
                icon.style.height = "10px";
                icon.style.backgroundColor = color;
                if (i>0) icon.style.marginLeft = "15px";

                var text = createElement("div", legend, "chart-legend-label noselect");
                text.style.lineHeight = "16px";
                text.innerText = label;
            }
            barGraph.setSubTitle(legend);



          //Create line data
            if (category.isRevenue===true && category.isExpense===true){


              //Get most recent year in the monthlyTotals
                var year = 0;
                for (var key in monthlyTotals) {
                    if (monthlyTotals.hasOwnProperty(key)){
                        year = Math.max(year, parseInt(key));
                    }
                }


              //Create data for 2 lines representing income and expenses for the year
                datasets = []; //clear datasets to remove barchart
                ["expenses", "income"].forEach((key, idx)=>{
                    var arr = [];
                    var values = monthlyTotals[year][key];
                    for (var i=0; i<values.length; i++){
                        var val = values[i];
                        if (key==="expenses") val = -val;
                        var prevVal = i>0 ? arr[i-1] : 0;
                        arr.push(val+prevVal);
                    }

                    datasets.push({
                        label: key,
                        data: arr,
                        type: 'line',
                        fill: false,
                        borderColor: colorRange[idx]
                    });
                });

            }
            else{

              //Create data for 2 lines representing current year and previous year
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
                            borderColor: colors[key]
                        });
                    }
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
        var td;

        td = table.addRow().addColumn("panel-toolbar");
        td.style.width = "100%";
        var toolbar = createElement('div', td);

        td = table.addRow().addColumn();
        td.style.width = "100%";
        td.style.height = "100%";


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

        downloadButton.onClick = function(){

          //Create csv
            var csvContent = "";

          //Add csv header
            var numColumns = 0;
            for (var i=0; i<columns.length; i++){
                var header = columns[i].header;
                if (header.length===0) break;
                if (i>0) csvContent += ",";
                csvContent += header;
                numColumns++;
            }
            csvContent += "\r\n";


          //Add csv data
            grid.forEachRow(function (row, content) {
                var row = "";
                for (var i=0; i<numColumns; i++){
                    if (i>0) row += ",";
                    var cell = content[i];
                    if (cell){
                        if (!(typeof cell === "string")){
                            cell = cell.innerText;
                        }
                        if (cell.indexOf(",")>-1 || cell.indexOf("\n")>-1){
                            cell = "\"" + cell + "\"";
                        }
                        cell = cell.replaceAll("#",""); //TODO: find proper way to encode characters like this
                    }
                    else{
                        cell = "";
                    }
                    row += cell;
                }
                csvContent += row + "\r\n";
            });


          //Download csv
            downloadCSV(csvContent, transactionsPanel.getTitle());
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
            if (category.isRevenue===true){
                title = "Total Revenue";
            }
            if (category.isExpense===true && category.isRevenue===true){
                title = "Revenue vs Expenses";
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
        var callout = new javaxt.dhtml.Callout(document.body, {
            style: {
                panel: "callout-panel",
                arrow: "callout-arrow"
            }
        });

        var innerDiv = callout.getInnerDiv();
        var contentDiv = createElement("div", innerDiv);
        contentDiv.style.padding = "5px";


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
                            label: "Compare Previous Year",
                            value: "prevYear"
                        },
                        {
                            label: "Show Montly Average",
                            value: "montlyAvg"
                        },
                        {
                            label: "Show Individual Months",
                            value: "months"
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
                        var callback = function(income, expenses){
                            renderAccountSummary(income, expenses, account, year, type);
                        };

                        if (type==="months"){
                            getAccountSummaryByMonth(account, year, callback);
                        }
                        else{
                            getAccountSummary(account, year, callback);
                        }

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


      //Create "panel" (actually a window)
        var panel = new javaxt.dhtml.Window(parent, {
            title: options.title,
            width: options.width,
            height: options.height,
            style: style
        });
        var div = createElement("div", panel.getBody(), {
            width: "100%",
            height: "100%",
            position: "relative"
        });


      //Create table
        var table = createTable(div);
        var td;


      //Subtitle
        td = table.addRow().addColumn();
        td.style.textAlign = "center";
        var subtitle = td;


      //Body
        td = table.addRow().addColumn();
        td.style.height = "100%";
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



      //Add settings
        if (options.settings===true){
            var settings = createElement("div", div, "report-settings noselect");
            settings.innerHTML = '<i class="fas fa-cog"></i>';
            panel.settings = settings;
        }


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
            if (!content) return;
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
        return new javaxt.dhtml.ComboBox(createElement("div"), comboboxConfig);
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
        var outerDiv = createElement("div", parent);
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.overflow = "hidden";


      //Create inner div
        var innerDiv = createElement("div", outerDiv);
        innerDiv.style.position = "absolute";
        innerDiv.style.width = width ? width : "100%";
        innerDiv.style.height = height ? height : "100%";


      //Create canvas
        var canvas = createElement('canvas', innerDiv);
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


        return canvas;
    };


  //**************************************************************************
  //** downloadCSV
  //**************************************************************************
    var downloadCSV = function(csvContent, title){
        if (!link) link = createElement("a", document.body, {
            display: "none"
        });

        var href;
        if (1>0){
            var blob = new Blob([csvContent], {type: "text/csv"});
            href = window.URL.createObjectURL(blob);
        }
        else{
            href = encodeURI("data:text/csv;charset=utf-8,"+csvContent);
        }



        link.setAttribute("href", href);
        link.setAttribute("download", title + ".csv");
        link.click();
    };


  //**************************************************************************
  //** findSource
  //**************************************************************************
    var findSource = function(sourceID){
        return javaxt.express.finance.utils.findSource(sourceID, vendors, sources, sourceAccounts);
    };


  //**************************************************************************
  //** pad
  //**************************************************************************
  /** Used to add a leading zero to an integer
   */
    var pad = function(i){
        if (i<10) return "0"+i;
        else return i+"";
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
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