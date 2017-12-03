/**
 * Created by Madhur on 11/22/2017.
 */

class Sunburst{

    constructor() {
        this.divSunburst = d3.select("#chart");

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

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

        this.partition = d3.partition();
        this.arc = d3.arc()
            .startAngle(d => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x0))))
            .endAngle(d => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x1))))
            .innerRadius(d => Math.max(0, this.yScale(d.y0)))
            .outerRadius(d => Math.max(0, this.yScale(d.y1)));

        // Initialize Breadcrumb

        this.breadDim = {
            w: this.svgWidth/4 - 20, h: 30, s: 3, t: 10
        };

        this.trail = d3.select("#sequence").append("svg:svg")
            .attr("width", this.width)
            .attr("height", 50)
            .attr("id", "trail")
            .attr("transform", "translate(10,10)");

        this.trail.append("svg:text")
            .attr("id", "endlabel")
            .style("fill", "#000");

        this.data = null;
        this.clicked = false;
    }

    update(){

        let self = this;

        let chart = this.svg.append("g")
            .attr("transform", "translate(" + this.width / 2 + "," + (this.height / 2) + ")");

        d3.select("#percentage")
            .attr("transform", "translate(" + this.width / 2 + "," + (this.height / 2) + ")");

        let root = d3.hierarchy({values: this.data}, function(d) { return d.values; })
            .sum(function(d) { return d.value; })
            .sort(function(a, b) { return b.value - a.value; });

        // For efficiency, filter nodes to keep only those large enough to see.
        let nodes = this.partition(root).descendants()
            .filter(function(d) {
                return (d.x1 - d.x0 > 0.001);
            });

        chart.selectAll("path")
            .data(nodes)
            .enter().append("path")
            .attr("d", this.arc)
            .style("fill", d => this.colorScale((d.children ? d : d.parent).data.key))
            .style("visibility", function (d) {
                if ((d.data.key == '' && !d.children))
                    return "hidden";
                return "";
            })
            .on("click", click)
            .on("mouseover", mouseover)
            .append("title")
            .text(function (d) {
                if (d.parent == null) {
                    return "";
                }
                let sbText = d.data.key;
                if (sbText == "")
                    sbText = d.parent.data.key;
                return sbText + "\n" + self.formatNumber(d.value);
            });

        let totalSize = root.value;

        chart.on("mouseleave", mouseleave);

        function mouseover(d) {

            let percentage = (100 * d.value / totalSize).toPrecision(3);
            let percentageString = percentage + "%";
            if (percentage < 0.1) {
                percentageString = "< 0.1%";
            }

            d3.select("#percentage")
                .text(percentageString);

            d3.select("#explanation")
                .style("visibility", "");

            let sequenceArray = d.ancestors().reverse();
            sequenceArray.shift(); // remove root node from the array
            updateBreadcrumbs(sequenceArray, percentageString);

            // Fade all the segments.
            self.svg.selectAll("path")
                .style("opacity", 0.3);

            // Then highlight only those that are an ancestor of the current segment.
            chart.selectAll("path")
                .filter(function(node) {
                    return (sequenceArray.indexOf(node) >= 0);
                })
                .style("opacity", 1);
        }

        // Restore everything to full opacity when moving off the visualization.
        function mouseleave(d) {

            // Hide the breadcrumb trail
            d3.select("#trail")
                .style("visibility", "hidden");

            // Deactivate all segments during transition.
            chart.selectAll("path").on("mouseover", null);

            // Transition each segment to full opacity and then reactivate it.
            chart.selectAll("path")
                .transition()
                .duration(500)
                .style("opacity", 1)
                .on("end", function() {
                    d3.select(this).on("mouseover", mouseover);
                });

            d3.select("#explanation")
                .style("visibility", "hidden");
        }

        // Generate a string that describes the points of a breadcrumb polygon.
        function breadcrumbPoints(d, i) {
            let points = [];
            points.push("0,0");
            points.push(self.breadDim.w + ",0");
            points.push(self.breadDim.w + self.breadDim.t + "," + (self.breadDim.h / 2));
            points.push(self.breadDim.w + "," + self.breadDim.h);
            points.push("0," + self.breadDim.h);
            if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                points.push(self.breadDim.t + "," + (self.breadDim.h / 2));
            }
            return points.join(" ");
        }

        // Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray, percentageString) {

            // Data join; key function combines name and depth (= position in sequence).
            let trail = d3.select("#trail")
                .selectAll("g")
                .data(nodeArray, function(d) { return d.data.key + d.depth; });

            // Remove exiting nodes.
            trail.exit().remove();

            // Add breadcrumb and label for entering nodes.
            var entering = trail.enter().append("svg:g");

            entering.append("svg:polygon")
                .attr("points", breadcrumbPoints)
                .style("fill", function(d) { return self.colorScale(d.data.key); });

            entering.append("svg:text")
                .attr("x", (self.breadDim.w + self.breadDim.t) / 2)
                .attr("y", self.breadDim.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    console.log(d);
                    let catText = d.data.key;
                    if (catText == "")
                        catText = d.parent.data.key;
                    if (catText.length > 24)
                        return catText.substr(0, 21) + "...";
                    return catText; });

            // Merge enter and update selections; set position for all nodes.
            entering.merge(trail).attr("transform", function(d, i) {
                return "translate(" + i * (self.breadDim.w + self.breadDim.s) + ", 0)";
            });

            // // Now move and update the percentage at the end.
            // d3.select("#trail").select("#endlabel")
            //     .attr("x", (nodeArray.length + 0.5) * (self.breadDim.w + self.breadDim.s))
            //     .attr("y", self.breadDim.h / 2)
            //     .attr("dy", "0.35em")
            //     .attr("text-anchor", "middle")
            //     .text(percentageString);

            // Make the breadcrumb trail visible, if it's hidden.
            d3.select("#trail")
                .style("visibility", "");

        }

        function click(d) {
            chart.transition()
                .duration(750)
                .tween("scale", function() {
                    let xd = d3.interpolate(self.xScale.domain(), [d.x0, d.x1]),
                        yd = d3.interpolate(self.yScale.domain(), [d.y0, 1]),
                        yr = d3.interpolate(self.yScale.range(), [d.y0 ? 20 : 0, self.radius]);
                    return function(t) {
                        self.xScale.domain(xd(t));
                        self.yScale.domain(yd(t)).range(yr(t));
                    };
                })
                .selectAll("path")
                .attrTween("d", function(d) {
                    return function() {
                        return self.arc(d);
                    };
                });


            self.clicked = true;
            if (d.ancestors().length > 1 && window.filters.Product != d.ancestors().reverse()[1].data.key){
                console.log("Inside if");
                window.filters.Product = d.ancestors().reverse()[1].data.key;
                window.updateFilters();
            }
        }

        d3.select(self.frameElement).style("height", this.height + "px");

    }

    updateData(){

        // Don't update if clicked on the current chart
        if (this.clicked){
            console.log("Clicked from product, so won't call update");
            this.clicked = false;
            return
        }

        let parseTime = d3.timeParse("%m/%d/%Y");

        this.svg.selectAll("path")
            .transition()
            .duration(500)
            .style("opacity", 0);

        this.data = window.allData.filter(function (d) {
            return (window.filters.Company == null || d["Company"] == window.filters.Company)
                && (window.filters.State == null || d["State"] == window.filters.State)
                && (window.filters.Start == null || (parseTime(d["Date received"]) >= window.filters.Start
                &&  parseTime(d["Date received"]) <= window.filters.End));

        });

        this.data = d3.nest()
                .key(d => d["Product"])
                .key(d => d["Sub-product"])
                .key(d => d["Issue"])
                .key(d => d["Sub-issue"])
                .rollup(function (leaves) {
                    return leaves.length
                })
                .entries(this.data);

        this.svg.selectAll("*").remove();

        this.update();
    }
}
