/** Class implementing the Map. */
class Map {
    constructor() {
        this.mapSelect = d3.select("#map");
        this.onetimeDropDown = false;
        this.margin = {top: 10, right: 20, bottom: 30, left: 50};
        this.svgBounds = this.mapSelect.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width //- this.margin.left - this.margin.right;
        this.svgHeight = 500;
    };


    drawMap() {
         this.mapSelect
            .append("svg")
            .attr("id", "tiles")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);
    }

    addMapData(companyName, companyStatesData) {
        let svgWidth = this.svgWidth;
        let svgHeight = this.svgHeight;

        d3.select("#indsStates").classed("selectMapHide", false);
        d3.select("#indsStates").classed("selectMap", true);
        d3.select('#selectMap').property('value', 'Total Complaints');
        d3.select("#map").selectAll("h4").html("Statistics of  ***" + companyName + "***  in  USA :");

        d3.csv("data/map.csv", function (error, mapData) {
            var maxColumns = d3.max(mapData, d=> (+d.Space))
            var minColumns = d3.min(mapData, d=> (+d.Space))
            var maxRows = d3.max(mapData, d=>(+d.Row))
            var minRows = d3.min(mapData, d=> (+d.Row))


            var linearScaleHeight = d3.scaleLinear()
                .domain([minRows, maxRows + 1])
                .range([0, svgHeight]);

            var linearScaleWidth = d3.scaleLinear()
                .domain([minColumns, maxColumns + 1])
                .range([0, svgWidth]);

            var colorScale = d3.scaleLinear()
                .domain([98, 100])
                .range(["white", "steelblue"]);

            var statesTemp = [];
            var states = []
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
                    }
                    else {
                        statesTemp = {
                            "Row": mapData[i].Row,
                            "Space": mapData[i].Space,
                            "Abbreviation": mapData[i].Abbreviation,
                            "State": mapData[i].State,
                            "StateTotal": "0",
                            "Disputed": "0",
                            "Timely": "0",
                            "PercentDisputed": "0",
                            "PercentTimely": "0"
                        }
                    }
                    states.push(statesTemp);
                }
            }

            console.log(states);

            d3.select("#tiles").selectAll("rect").remove();
            d3.select("#tiles").selectAll("text").remove();

            var tilerect =  d3.select("#tiles").selectAll("rect").data(states)
                .enter()
                .append("rect")
                .attr("x", d =>linearScaleWidth(+d.Space))
                .attr("y", d => linearScaleHeight(+d.Row))
                .attr("width", (svgWidth / (maxColumns + 1)))
                .attr("height", (svgHeight / (maxRows + 1)))
                .attr("fill", d=> colorScale(+d.PercentTimely))
                .classed("tile", true)

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