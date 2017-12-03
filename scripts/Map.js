/** Class implementing the Map. */
class Map {
    constructor(stateData) {
        this.mapSelect = d3.select("#map");
        this.array = [];
        this.margin = {top: 10, right: 20, bottom: 30, left: 20};
        this.svgBounds = this.mapSelect.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 400;
        this.svg = this.mapSelect
            .append("svg")
            .attr("id", "tiles")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
            .attr("align","center")
            .attr("transform", "translate(10,80)");
            // .attr("display", "block")
            // .attr("margin","auto");

        this.stateDetails = stateData;
        this.mapData = null;
        this.clicked = false;
    };

    tooltip_render(tooltip_data) {
        if(tooltip_data.Total != null) {
            let text = "<h2 class =" + tooltip_data.state + " >" + tooltip_data.state + "</h2>";
            text += "<li>";
            text += "Total Complaints : " + tooltip_data.Total;
            text += "<li>";
            text += "Disputed Complaints(%) : " + tooltip_data.PercentageDisputed.toFixed(2) + '%';
            text += "<li>";
            text += "Timely Resolved Complaints(%) : " + tooltip_data.PercentageTimely.toFixed(2) + '%';
            text += "<ul>";
            return text;
        }
        else{
            let text = "The Company is not "
            text += "present in :" +tooltip_data.state;
            text += "<ul>";
            return text;
        }
    }

    updateMap(selectedValue) {
        let self = this;
        let svgWidth = this.svgWidth;
        let svgHeight = this.svgHeight;
        let tilesvg = this.svg;

        var tooltip = this;
        var tip = d3.tip().attr('class', 'd3-tip')
            .direction('sw')
            .offset(function () {
                return [0, 0];
            })
            .html(
                function (d) {
                    var tooltip_data =
                        {
                            "state": d.State,
                            "Total": d.Total,
                            "PercentageDisputed": d.PercentDisputed,
                            "PercentageTimely": d.PercentTimely
                        }
                    return tooltip.tooltip_render(tooltip_data);
                });

        tilesvg.call(tip);
        let maxColumns = d3.max(self.stateDetails, d => (+d.Space))
        let minColumns = d3.min(self.stateDetails, d => (+d.Space))
        let maxRows = d3.max(self.stateDetails, d => (+d.Row))
        let minRows = d3.min(self.stateDetails, d => (+d.Row))

        let linearScaleHeight = d3.scaleLinear()
            .domain([minRows, maxRows + 1])
            .range([0, svgHeight]);

        let linearScaleWidth = d3.scaleLinear()
            .domain([minColumns, maxColumns + 1])
            .range([0, svgWidth]);

        let minSelected = d3.min(self.mapData, function (d) {
            if (d[selectedValue] != null) {
                return (+d[selectedValue]);
            }
        });
        let maxSelected = d3.max(self.mapData, d => (+d[selectedValue]));

        let colorScale = d3.scaleLinear()
            .domain([minSelected, maxSelected])
            .range(["#EFF2FB", "steelblue"]);


        let barSelection = d3.select("#barId");
        let stateGroup = this.svg.selectAll("g").data(self.mapData);
        let stateAdd = stateGroup.enter().append("g");
        stateAdd.append("rect").classed("tile",true);
        stateAdd.append("text").classed("state-abbr",true);
        stateGroup.exit().remove();
        stateGroup = stateAdd.merge(stateGroup)
            .on("mouseover",tip.show)
            .on("mouseout",tip.hide);

        let rectData = stateGroup
            .select("rect");
        let rectAdd = rectData.enter().append("rect");
        rectData.exit().remove();
        rectData = rectAdd.merge(rectData);
        rectData.call(tip)
        rectData
            .attr("x", d => linearScaleWidth(+d.Space))
            .attr("y", d => linearScaleHeight(+d.Row))
            .attr("width", (svgWidth / (maxColumns + 1)))
            .attr("height", (svgHeight / (maxRows + 1)))
            .attr("fill", function (d) {
                if (d[selectedValue] != null) {
                    return colorScale(+d[selectedValue])
                }
                else {
                    return "lightcoral";
                }
            })
            .on("click",clicked)
            .classed("tile", true)

        let abbrData = stateGroup.select(".state-abbr");
        let abbrAdd = abbrData.enter().append("text");
        abbrData.exit().remove();
        abbrData = abbrAdd.merge(abbrData);
        abbrData
            .attr("dx", d => linearScaleWidth(+d.Space) + (svgWidth / (maxColumns + 1)) / 3)
            .attr("dy", d => linearScaleHeight(+d.Row) + (svgHeight / (maxRows + 1)) / 2)
            .text(d => d.Abbreviation)
            .attr("fill", "black")
            .style("font-size", "20px");

        function clicked(d){
            self.clicked = true;
            if(window.filters.State != d.Abbreviation){
                window.filters.State = d.Abbreviation;
                window.updateFilters();
            }

        }
    }

    updateData() {

        let self = this;
        // Don't update if clicked on the current chart
        if (this.clicked) {
            this.clicked = false;
            return
        }
        this.mapData = [];
        let parseTime = d3.timeParse("%m/%d/%Y");
        this.data = window.allData.filter(function (d) {
            return (window.filters.Company == null || d["Company"] == window.filters.Company)
                && (window.filters.Product == null || d["Product"] == window.filters.Product)
                && (window.filters.Start == null || (parseTime(d["Date received"]) >= window.filters.Start
                    && parseTime(d["Date received"]) <= window.filters.End));
        });
        this.data = d3.nest()
            .key(d=> d["State"])
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

        for (let mData of self.stateDetails){
            let found = false;
            for (let d of this.data){
                if (d.key == mData.Abbreviation){
                    found = true;
                    this.mapData.push(generateRow(mData, d.value));
                    break;
                }
            }
            if (!found)
                this.mapData.push(generateRow(mData, null));
        };

        function generateRow(mapData, nestData) {
            if (nestData != null) {
                return {
                    "Row": mapData.Row,
                    "Space": mapData.Space,
                    "Abbreviation": mapData.Abbreviation,
                    "State": mapData.State,
                    "Total": nestData["Total"],
                    "Disputed": nestData["Disputed"],
                    "Timely": nestData["Timely"],
                    "PercentDisputed": nestData["PercentDisputed"],
                    "PercentTimely": nestData["PercentTimely"]
                }
            }
            return {
                "Row": mapData.Row,
                "Space": mapData.Space,
                "Abbreviation": mapData.Abbreviation,
                "State": mapData.State,
                "Total": null,
                "Disputed": null,
                "Timely": null,
                "PercentDisputed": null,
                "PercentTimely": null
            }
        }
        self.svg.selectAll("*").remove();

        this.changeView();

    }

    changeView(){
        let dropdown = document.getElementById("inds");
        let view = dropdown.options[dropdown.selectedIndex].value;
        this.updateMap(view);
    }

}