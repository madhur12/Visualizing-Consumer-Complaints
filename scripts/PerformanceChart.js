class PerformanceChart {

    constructor(allComplaintsData)
    {
        this.onetime = false;
        this.divBestWorst = d3.select("#best-worst");
        this.count = 0;
        // Initializes the svg elements required for this chart
        this.margin = {top: 10, right: 20, bottom: 30, left: 50};
        this.svgBounds = this.divBestWorst.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 500;

        this.svg = this.divBestWorst
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);

        var States = [];
        //Initializing the data for this chart
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
            .entries(allComplaintsData);

        this.tableData = []

    }

    updateCompanies(strSort) {
        var counter = this.count;
        let self = this;
        var totaldata = self.data;
        var paddingLeft = 250;
        var paddingBottom = 50;
        var g1 = self.svg.append("g").attr("transform", "translate(20,10)");
        var g2 = self.svg.append("g").attr("transform", "translate(20,10)");

        var data = []
        totaldata.forEach(function (d) {
            if (d.value.Total > 1000) {
                data.push(d);
            }
        })

        if (document.contains(document.getElementById("xaxis"))) {
            document.getElementById("xaxis").remove();
        }
        if (document.contains(document.getElementById("yaxis"))) {
            document.getElementById("yaxis").remove();
        }

        function GetTopTenCompanies(arrayData) {
            arrayData.sort(function (a, b) {
                return d3.descending((a.value[strSort]), (b.value[strSort]));
            });
            return arrayData.slice(0, 10);
        }

        function GetBottomTenCompanies(arrayData) {
            arrayData.sort(function (a, b) {
                return d3.ascending((a.value[strSort]), (b.value[strSort]));
            });
            return arrayData.slice(0, 10);
        }

        data = GetTopTenCompanies(data).concat(GetBottomTenCompanies(data).reverse())
        var y = d3.scaleBand()
            .domain(data.map(function (d) {
                return d.key;
            }))
            .range([0, self.svgHeight - paddingBottom]);

        let x = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) {
                return d.value[strSort]
            })])
            .range([0, self.svgWidth - paddingLeft - 20])
            .nice();

        let yAxis = d3.axisLeft()
            .scale(y);
        let xAxis = d3.axisBottom()
            .scale(x);

        g1.append("g")
            .attr("id", "yaxis")
            .attr("transform", "translate(" + paddingLeft + "," + 0 + ")")
            .call(yAxis)
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


        var barAppend = self.svg.append("g")
            .attr("id", "barId")
            .attr("transform", "translate(20,10)");
        var barSelection = d3.select("#barId");
        var rectSelect = barSelection.selectAll("rect").data(data)
        var newbars = rectSelect.enter().append("rect");
        rectSelect.exit().remove();
        rectSelect = newbars.merge(rectSelect);

        rectSelect
            .transition().duration(1500)
            .attr("x", paddingLeft)
            .attr("y", function (d, i) {
                return ((self.svgHeight - paddingBottom) / 20) * i;
            })
            .attr("width", function (d) {
                return x(d.value[strSort]);
            })
            .attr("height", (self.svgHeight - paddingBottom) / 20)
            .style("fill", function (d, i) {
                if (i < 10) {
                    return "LightCoral";
                }
                else {
                    return "Steelblue";
                }
            })
            .style("stroke", "black")
            .style("stroke-width", "1px");


        var message = "" ;
        var val;
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

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        rectSelect.on("mouseover", function (d) {
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
            var table = d3.select("body").append("table")
                    .attr("id", "table")
                    .attr("width", this.svgWidth)
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
                .style("background-color", "grey")
                .text(function (column) {
                    return column;
                });
            d3.select("#table").style("display", "none");
            this.onetime = true;
        }

        rectSelect
            .on("click", function(d) {
                rectSelect.
                style("fill", function (d,i) {
                    if (i < 10 ) {
                        return "LightCoral";
                    }
                    else {
                        return "Steelblue";
                    }
                });
                d3.select(this)
                    .style("fill", "red");
                d3.select("#table").style("display", "table");
                let data = this.__data__;

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
            })

            let tdata = rowData.selectAll("td")
                .data(function (d) {
                        return [  d.value.Total,
                              d.value.Timely,
                            d.value.Disputed,
                            (d.value.PercentDisputed).toFixed(2)+'%',
                            (d.value.PercentTimely).toFixed(2)+'%',
                            "button-"+d.key ]
                })


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
    }
}

