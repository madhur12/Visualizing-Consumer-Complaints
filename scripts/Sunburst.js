/**
 * Created by Madhur on 11/22/2017.
 */

class Sunburst{

    constructor(allData) {
        console.log("Sunburst Called");
        this.divSunburst = d3.select("#sunburst");

        // Initializes the svg elements required for this chart
        this.margin = {top: 10, right: 20, bottom: 30, left: 20};

        // Get SVG Bounds and add SVG
        this.svgBounds = this.divSunburst.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 700;
        this.svg = this.divSunburst
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);

        // Initializing Sunburst chart variables
        this.width = this.svgWidth - 10;
        this.height = this.svgHeight - 20;
        this.radius = (Math.min(this.width, this.height) / 2) - 10;

        this.formatNumber = d3.format(",d");

        this.xScale = d3.scaleLinear()
            .range([0, 2 * Math.PI]);

        this.yScale = d3.scaleSqrt()
            .range([0, this.radius]);

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory20);

        this.partition = d3.partition();
        this.arc = d3.arc()
            .startAngle(d => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x0))))
            .endAngle(d => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x1))))
            .innerRadius(d => Math.max(0, this.yScale(d.y0)))
            .outerRadius(d => Math.max(0, this.yScale(d.y1)));


        this.allData = allData;

        // For Interactivity

        this.performanceObj = null;
        this.timelineObj = null;
        this.mapObj = null;
        this.data = null;
    }

    update(){

        let self = this;

        let svg = this.svg.append("g")
            .attr("transform", "translate(" + this.width / 2 + "," + (this.height / 2) + ")");

        let root = d3.hierarchy({values: this.data}, function(d) { return d.values; })
            .sum(function(d) { return d.value; })
            .sort(function(a, b) { return b.value - a.value; });

        svg.selectAll("path")
            .data(this.partition(root).descendants())
            .enter().append("path")
            .attr("d", this.arc)
            .style("fill", d => d.data.key == '' ? "none" : this.colorScale((d.children ? d : d.parent).data.key))
            .on("click", click)
            .append("title")
            .text(d => d.data.key + "\n" + this.formatNumber(d.value));

        function click(d) {
            svg.transition()
                .duration(750)
                .tween("scale", function() {
                    var xd = d3.interpolate(self.xScale.domain(), [d.x0, d.x1]),
                        yd = d3.interpolate(self.yScale.domain(), [d.y0, 1]),
                        yr = d3.interpolate(self.yScale.range(), [d.y0 ? 20 : 0, this.radius]);
                    return function(t) { self.xScale.domain(xd(t)); self.yScale.domain(yd(t)).range(yr(t)); };
                })
                .selectAll("path")
                .attrTween("d", function(d) { return function() { return self.arc(d); }; });
        }

        d3.select(self.frameElement).style("height", this.height + "px");

    }

    updateData(timeStart = null, timeEnd = null, product = null, company = null, state = null){
        this.data = this.allData;
        console.log("Initial Data : ", this.data);
        let parseTime = d3.timeParse("%m/%d/%Y");
        if (timeStart != null){
            this.data = this.data.filter(function (d) {
                return parseTime(d["Date received"]) >= timeStart &&  parseTime(d["Date received"]) <= timeEnd;
            })
        }
        if (product != null){
            this.data = this.data.filter(function (d) {
                return parseTime(d["Product"]) == product;
            })
        }
        if (company != null){
            this.data = this.data.filter(function (d) {
                return parseTime(d["Company"]) == company;
            })
        }
        if (state != null){
            this.data = this.data.filter(function (d) {
                return parseTime(d["State"]) == state;
            })
        }

        this.data = // {
            // "key": "root", "values":
                d3.nest()
                .key(d => d["Product"])
                .key(d => d["Sub-product"])
                .key(d => d["Issue"])
                .key(d => d["Sub-issue"])
                .rollup(function (leaves) {
                    return leaves.length
                })
                .entries(this.data)
            // };

        console.log("Sunburst Data : ", this.data);
        this.update();
    }
}
