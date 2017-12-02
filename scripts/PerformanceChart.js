class PerformanceChart {

    constructor()
    {
        this.onetime = false;
        this.divBestWorst = d3.select("#best-worst");
        this.count = 0;
        // Initializes the svg elements required for this chart
        this.margin = {top: 10, right: 20, bottom: 20, left: 50};
        this.svgBounds = this.divBestWorst.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 700;

        this.svg = this.divBestWorst
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
            .attr("id", "checkchutiyekacode");



        let States = [];
        //Initializing the data for this chart
        this.data = null;

        this.tableData = [];
        this.clicked = false;
    }

    updateCompanies(strSort) {

        // Minimum Number of Total Complaints:
        let minComplaints = 300;

        // min number of companies in the performance chart
        let numCompanies = 10;

        let counter = this.count;
        let self = this;
        let totaldata = self.data;
        let paddingLeft = 250;
        let paddingBottom = 50;
        let g1 = self.svg.append("g").attr("transform", "translate(20,10)");
        let g2 = self.svg.append("g").attr("transform", "translate(20,10)");
        let data = [];


        let gMessage = this.svg
            .append("g")
            .attr("transform", "translate(" + 20 + "," + self.svgHeight/2 +")")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
            .attr("id", "gMessage");

        totaldata.forEach(function (d) {
            if (d.value.Total > minComplaints) {
                data.push(d);
            }
        });

        let maxValue = d3.max(totaldata , function (d) {
            return (+d.value["Total"]) ;
        });


        if (document.contains(document.getElementById("xaxis"))) {
            document.getElementById("xaxis").remove();
        }
        if (document.contains(document.getElementById("yaxis"))) {
            document.getElementById("yaxis").remove();
        }
        if (document.contains(document.getElementById("yaxisWorst"))) {
            document.getElementById("yaxisWorst").remove();
        }


        function GetTopTenCompanies(arrayData) {
            arrayData.sort(function (a, b) {
                return d3.descending((a.value[strSort]), (b.value[strSort]));
            });
            return arrayData.slice(0, numCompanies);
        }

        function GetBottomTenCompanies(arrayData) {
            arrayData.sort(function (a, b) {
                return d3.ascending((a.value[strSort]), (b.value[strSort]));
            });
            return arrayData.slice(0, numCompanies);
        }

        let dataX = GetTopTenCompanies(data).concat(GetBottomTenCompanies(data).reverse())

        let dataWorst = GetTopTenCompanies(data)
        let dataBest = GetBottomTenCompanies(data).reverse()


        let yBest = d3.scaleBand()
            .domain(dataBest.map(function (d) {
                return d.key;
            }))
            .range([self.svgHeight/2, self.svgHeight -30]);

        let yWorst = d3.scaleBand()
            .domain(dataWorst.map(function (d) {
                return d.key;
            }))
            .range([0, self.svgHeight/2 - 30]);


        let x = d3.scaleLinear()
            .domain([0, d3.max(dataX, function (d) {
                return d.value[strSort]
            })])
            .range([0, self.svgWidth - paddingLeft - 20])
            .nice();

        let yAxisBest = d3.axisLeft()
            .scale(yBest);
        let yAxisWorst = d3.axisLeft()
            .scale(yWorst);

        let xAxis = d3.axisBottom()
            .scale(x);

        g1.append("g")
            .attr("id", "yaxis")
            .attr("transform", "translate(" + paddingLeft + "," + -20  + ")")
            .call(yAxisBest)
            .selectAll("text")
            .style("font-weight", "bold")

        g1.append("g")
            .attr("id", "yaxisWorst")
            .attr("transform", "translate(" + paddingLeft + "," + 0 + ")")
            .call(yAxisWorst)
            .selectAll("text")
            .style("font-weight", "bold")


        g2.append("g")
            .attr("id", "xaxis")
            .attr("transform", "translate(" + paddingLeft + "," + (self.svgHeight - paddingBottom) + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .style("font-weight", "bold")
            .attr("dx", "-.8em")
            .attr("dy", "-.25em")
            .attr("transform", function (d) {
                return "rotate(-45)"
            });

        if (maxValue < minComplaints) {
            if (document.contains(document.getElementById("xaxis"))) {
                document.getElementById("xaxis").remove();
            }
            if (document.contains(document.getElementById("yaxis"))) {
                document.getElementById("yaxis").remove();
            }
            if (document.contains(document.getElementById("yaxisWorst"))) {
                document.getElementById("yaxisWorst").remove();
            }
            gMessage.selectAll("text").exit().remove()
            gMessage
                .append("text")
                .html("No Data meets the selected criteria !!!" +"<br/>" + " Please Try changing Filters")
                .style("font-weight", "bold")
                .style("fill" ,"steelblue")
                .style("font-size", 36)
        }

        let background = self.svg.append("g");
        background
            .append("text")
            .attr("x",self.svgWidth/2)
            .attr("y",self.svgHeight/4)
            .attr("text-anchor","middle")
            .attr("class", "performer-category")
            .text("TOP");

        background
            .append("text")
            .attr("x",self.svgWidth/2)
            .attr("y",self.svgHeight*3/4)
            .attr("text-anchor","middle")
            .attr("class", "performer-category")
            .text("BOTTOM");


        let barAppendBest = self.svg.append("g")
            .attr("id", "barIdBest")
            .attr("transform","translate(20, " + (self.svgHeight/2 - 10) + ")");
        let barSelectionBest = d3.select("#barIdBest");
        let rectSelectBest = barSelectionBest.selectAll("rect").data(dataBest);
        let newbarsBest = rectSelectBest.enter().append("rect")
            .attr("x", paddingLeft)
            .attr("y", function (d, i) {
                return ((self.svgHeight/2) / (dataBest.length+1)) * i;
            })
            .attr("width", 0)
            .attr("height", ((self.svgHeight/2) / (dataBest.length+1)))
            .style("fill", "#99c0e5")
            .style("opacity", 0)
            .style("stroke", "black")
            .style("stroke-width", "1px");

        rectSelectBest.exit().remove();
        rectSelectBest = newbarsBest.merge(rectSelectBest);

        rectSelectBest
            .transition().duration(3000)
            .attr("x", paddingLeft)
            .attr("y", function (d, i) {
                return (((self.svgHeight/2) / (dataBest.length +1)) * i);
            })
            .attr("width", function (d) {
                return x(d.value[strSort]);
            })
            .attr("height", ((self.svgHeight/2)/ (dataBest.length +1)))
            .style("fill", "#99c0e5")
            .style("opacity", 0.7)
            .style("stroke", "black")
            .style("stroke-width", "1px");


        let barAppendWorst = self.svg.append("g")
            .attr("id", "barIdWorst")
            .attr("transform",  "translate(20,10)");
        let barSelectionWorst = d3.select("#barIdWorst");
        let rectSelectWorst = barSelectionWorst.selectAll("rect").data(dataWorst)
        let newbarsWorst = rectSelectWorst.enter().append("rect")
            .attr("x", paddingLeft)
            .attr("y", function (d, i) {
                return (((self.svgHeight/2) / (dataWorst.length+1)) * i);
            })
            .attr("width", 0)
            .attr("height", ((self.svgHeight/2) / (dataWorst.length+1)))
            .style("fill", "#fda4a7")
            .style("opacity", 0)
            .style("stroke", "black")
            .style("stroke-width", "1px");

        rectSelectWorst.exit().remove();
        rectSelectWorst = newbarsWorst.merge(rectSelectWorst);

        rectSelectWorst
            .transition().duration(3000)
            .attr("x", paddingLeft)
            .attr("y", function (d, i) {
                return (((self.svgHeight/2) / (dataWorst.length+1)) * i);
            })
            .attr("width", function (d) {
                return x(d.value[strSort]);
            })
            .attr("height", ((self.svgHeight/2)/ (dataWorst.length+1)))
            .style("fill", "#fda4a7")
            .style("opacity", 0.7)
            .style("stroke", "black")
            .style("stroke-width", "1px");


        let message = "" ;
        let val;
        function getMessage(d) {
            if (strSort == "Total") {
                message = "Total Complaints :";
                val = d.value[strSort]
            }
            else if (strSort == "Disputed") {
                message = "Disputed Complaints :";
                val = d.value[strSort]
            }
            else if (strSort == "Timely") {
                message = "Timely Responded Complaints :";
                val = d.value[strSort]
            }
            else if (strSort == "PercentDisputed") {
                message = "Disputed Complaints(%) :";
                val = d.value[strSort].toFixed(2) + "%"
            }
            else if (strSort == "PercentTimely") {
                message = "Timely Responded Complaints(%) :";
                val = d.value[strSort].toFixed(2) + "%"
            }
            return val,message
        }

        let div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        rectSelectWorst.on("mouseover", function (d) {
            val, message = getMessage(d)
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(message+ "" + "<br/>" + "" + val)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        rectSelectBest.on("mouseover", function (d) {
            val, message = getMessage(d)
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(message+ "" + "<br/>" + "" + val)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        if (!this.onetime) {
            let columns = ["Company Name", "Total Complaints", "Timely Responded Complaints", "Disputed Complaints", "Percentage of Disputed Complaints", "Percentage of Timely Responses", " "]
            let table = d3.select("body").append("table")
                    .attr("id", "table")
                    .attr("width", this.svgWidth + this.svgWidth)
                    .attr("align", "center")
                    .style("border-collapse", "collapse")// <= Add this line in
                    .style("border", "2px black solid"), // <= Add this line in
                thead = table.append("thead"),
                tbody = table.append("tbody");

            tbody.attr("id","tbody")
            thead.append("tr")
                .selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                .attr("height", 20)
                .style("background-color", "lightgrey")
                .text(function (column) {
                    return column;
                });
            d3.select("#table").style("display", "none");
            this.onetime = true;
        }

        this.svg.selectAll("rect")
            .on("click", function(d) {
                rectSelectBest.
                style("fill", "steelblue")
                rectSelectWorst.
                style("fill", "LightCoral")
                d3.select(this)
                    .style("fill", "red");
                d3.select("#table").style("display", "table");
                let data = this.__data__;

                self.clicked = true;
                if (window.filters.Company != data.key){
                    window.filters.Company = data.key;
                    window.updateFilters();
                };

                if (self.tableData.find(d => d.key == data.key) == null) {
                    self.tableData.push(data);
                    tabulate();
                }
            });

        function tabulate() {
            let rows = d3.select("#tbody").selectAll("tr");
            let rowData = rows.data(self.tableData);
            let rowEnter = rowData.enter().append("tr");
            rowEnter.append("th");
            rowData.exit().remove();
            rowData = rowEnter.merge(rowData);
            let thead = rowData.select("th");
            thead.text(d => d.key);

            rowData.style("background-color", function () {
                if(counter % 2 == 0){counter++ ; return "#A9D0F5"}
                else{counter++; return "#EFF2FB"}
            });

            let tdata = rowData.selectAll("td")
                .data(function (d) {
                    return [  d.value.Total,
                        d.value.Timely,
                        d.value.Disputed,
                        (d.value.PercentDisputed).toFixed(2)+'%',
                        (d.value.PercentTimely).toFixed(2)+'%',
                        "button-"+d.key ]
                });


            tdata.enter().append("td");

            rowData.selectAll("td")
                .attr("style", "font-family: sans-serif") // sets the font style
                .text(function(d){
                    if (d.toString().includes("button"))
                        return null;
                    return d; })
                .attr("class", function (d) {
                    if (d.toString().includes("button"))
                        return "button";
                });

            d3.selectAll(".button")
                .append("button")
                .text("X")
                .on("click", d => clearData(d.replace("button-","")));

            return table;
        }

        function clearData(key){
            for (let idx = 0 ; idx < self.tableData.length; idx++){
                if (self.tableData[idx].key == key)
                    self.tableData.splice(idx, 1);
            }

            tabulate();
        }
        console.log("in main")
        d3.select("#inds").on("change", function () {
            let dropdown = document.getElementById("inds");
            let view = dropdown.options[dropdown.selectedIndex].value;
            self.updateCompanies(view);
            window.mapObj.updateMap(view);
        });
    }

    updateData(){

        let self = this;

        // Don't update if clicked on the current chart
        if (this.clicked){
            this.clicked = false;
            return
        }
        let re =this.svg.selectAll("rect")
            .transition()
            .duration(1500)
            .attr("width", 0)
            .style("opacity", 0.0);
        let parseTime = d3.timeParse("%m/%d/%Y");

        this.data = window.allData.filter(function (d) {
            return (window.filters.Product == null || d["Product"] == window.filters.Product)
                && (window.filters.State == null || d["State"] == window.filters.State)
                && (window.filters.Start == null || (parseTime(d["Date received"]) >= window.filters.Start
                    &&  parseTime(d["Date received"]) <= window.filters.End));

        });

        this.data = d3.nest()
            .key(d => d["Company"])
            .rollup(function(d) {
                return {
                    "Total": d3.sum(d, d => 1),
                    "SubmittedviaRef": d3.sum(d, d => d["Submitted via"] == "Referral" ? 1 : 0),
                    "SubmittedviaPhone": d3.sum(d, d => d["Submitted via"] == "Phone" ? 1 : 0),
                    "SubmittedviaPost": d3.sum(d, d => d["Submitted via"] == "Postal mail" ? 1 : 0),
                    "SubmittedviaMail": d3.sum(d, d => d["Submitted via"] == "Mail" ? 1 : 0),
                    "SubmittedviaFax": d3.sum(d, d => d["Submitted via"] == "Fax" ? 1 : 0),
                    "SubmittedviaWeb": d3.sum(d, d => d["Submitted via"] == "Web" ? 1 : 0),
                    "Timely": d3.sum(d, d => d["Timely response?"] == "Yes" ? 1 : 0),
                    "Disputed": d3.sum(d, d => d["Consumer disputed?"] == "Yes" ? 1 : 0),
                    "PercentDisputed" : (d3.sum(d, d => d["Consumer disputed?"] == "Yes" ? 1 : 0)/d3.sum(d, d => 1) *100),
                    "PercentTimely" : (d3.sum(d, d => d["Timely response?"] == "Yes" ? 1 : 0)/d3.sum(d, d => 1) *100)
                }
            })
            .entries(this.data);


        self.svg.selectAll("*").remove();

        this.changeView();

    }

    changeView(){
        let dropdown = document.getElementById("inds");
        let view = dropdown.options[dropdown.selectedIndex].value;
        this.updateCompanies(view);
    }
}