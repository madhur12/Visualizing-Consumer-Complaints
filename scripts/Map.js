/** Class implementing the Map. */
class Map {
    constructor() {
        this.mapSelect = d3.select("#map");
        this.onetimeDropDown = false;
        this.margin = {top: 10, right: 150, bottom: 30, left: 150};
        this.svgBounds = this.mapSelect.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 400;
    };

    tooltip_render(tooltip_data) {
        let text = "<h2 class =" + tooltip_data.state + " >" + tooltip_data.state + "</h2>";
        text += "<li>";
        text += "Total Complaints : " + tooltip_data.StateTotal;
        text += "<li>";
        text += "Disputed Complaints(%) : " + tooltip_data.PercentageDisputed.toFixed(2) + '%';
        text += "<li>";
        text += "Timely Resolved Complaints(%) : " + tooltip_data.PercentageTimely.toFixed(2) + '%';
        text += "<ul>";
        return text;
    }

    drawMap() {

        let divMap = d3.select("#map").append("div")
            .attr("align","center")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)

         this.svg = divMap
            .append("svg")
            .attr("id", "tiles")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
    }

    addMapData(companyName, companyStatesData) {
        let selectedValue = "PercentDisputed";
        let svgWidth = this.svgWidth;
        let svgHeight = this.svgHeight;
        let tilesvg = this.svg;

        var tooltip = this;
        var tip = d3.tip().attr('class', 'd3-tip')
            .direction('se')
             .offset(function () {
                 return [0, 0];
             })
            .html(
                function (d) {
                    var tooltip_data =
                        {
                            "state": d.State,
                            "StateTotal" : d.StateTotal,
                            "PercentageDisputed":d.PercentDisputed,
                            "PercentageTimely": d.PercentTimely
                        }
                    return tooltip.tooltip_render(tooltip_data);
                });

        d3.select("#indsStates").classed("selectMapHide", false);
        d3.select("#indsStates").classed("selectMap", true);
        d3.select('#selectMap').property('value', 'Total Complaints');
        d3.select("#map").selectAll("h4").html("Statistics of  ***" + companyName + "***  in  USA :");

        tilesvg.call(tip);
        d3.csv("data/map.csv", function (error, mapData) {
            let maxColumns = d3.max(mapData, d=> (+d.Space))
            let minColumns = d3.min(mapData, d=> (+d.Space))
            let maxRows = d3.max(mapData, d=>(+d.Row))
            let minRows = d3.min(mapData, d=> (+d.Row))


            let linearScaleHeight = d3.scaleLinear()
                .domain([minRows, maxRows + 1])
                .range([0, svgHeight]);

            let linearScaleWidth = d3.scaleLinear()
                .domain([minColumns, maxColumns + 1])
                .range([0, svgWidth]);

            let statesTemp = [];
            let states = []


            for (var i = 0; i < mapData.length; i++) {
                for (var j = 0; j < companyStatesData.length; j++) {
                    if (mapData[i].Abbreviation == companyStatesData[j].key) {
                        statesTemp = {
                            "Row": mapData[i].Row,
                            "Space": mapData[i].Space,
                            "Abbreviation": mapData[i].Abbreviation,
                            "State": mapData[i].State,
                            "StateTotal": companyStatesData[j].value["StateTotal"],
                            "Disputed": companyStatesData[j].value["Disputed"],
                            "Timely": companyStatesData[j].value["Timely"],
                            "PercentDisputed": companyStatesData[j].value["PercentDisputed"],
                            "PercentTimely": companyStatesData[j].value["PercentTimely"]
                        }
                        states.push(statesTemp);
                    }

                }
            }



            let minSelected = d3.min(states,function (d) {
                if(d[selectedValue] != "0"){
                    return (+d[selectedValue]);
                }
            })
            let maxSelected = d3.max(states, d=> (+d[selectedValue]))

            let colorScale = d3.scaleLinear()
                .domain([minSelected, maxSelected])
                .range(["#EFF2FB", "steelblue"]);


            d3.select("#tiles").selectAll("rect").remove();
            d3.select("#tiles").selectAll("text").remove();

            let tilerect =  d3.select("#tiles").selectAll("rect").data(states)
                .enter()
                .append("rect")
                .attr("x", d =>linearScaleWidth(+d.Space))
                .attr("y", d => linearScaleHeight(+d.Row))
                .attr("width", (svgWidth / (maxColumns + 1)))
                .attr("height", (svgHeight / (maxRows + 1)))
                .attr("fill", function (d) {
                    if(d[selectedValue] != "0"){
                        return colorScale(+d[selectedValue])
                    }
                    else{
                        return "lightcoral";
                    }
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .classed("tile", true)

            tilerect.attr("align", "center")

            d3.select("#tiles").selectAll("text").data(states)
                .enter()
                .append("text")
                .attr("dx", d=> linearScaleWidth(+d.Space) + (svgWidth / (maxColumns + 1)) / 3)
                .attr("dy",d=> linearScaleHeight(+d.Row) + (svgHeight / (maxRows + 1)) / 2)
                .text( d=> d.Abbreviation)
                .attr("fill", "black")
                .style("font-size", "20px")

        });
    }

}