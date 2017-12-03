/**
 * Created by Madhur on 11/8/2017.
 */

class Timeline {

    /**
     * Constructor for the TimeLine
     *
     * @param allComplaintsData entire CSV file
     */
    constructor(allComplaintsData) {

        this.divTimeLine = d3.select("#timeline");

        // Initializes the svg elements required for this chart
        this.margin = {top: 10, right: 20, bottom: 30, left: 50};

        // Get SVG Bounds and add SVG
        this.svgBounds = this.divTimeLine.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 350;
        this.height1 = 220;
        this.height2 = 50;

        this.legendSVG = this.divTimeLine
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", 20);

        this.svg = this.divTimeLine
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);

        this.tooltipDiv = this.divTimeLine.append("div")
            .attr("id", "timetool")
            .style("opacity", 0);

        this.tooltipSpan = this.tooltipDiv.append("span");

        // Initializing the Time parser and Scales
        this.parseTime = d3.timeParse("%m/%d/%Y");
        this.parseTimeContext = d3.timeParse("%m/%Y");

        this.xScale = d3.scaleTime().range([0, this.svgWidth]);
        this.yScale = d3.scaleLinear().range([this.height1, 0]);
        this.x2Scale = d3.scaleTime().range([0, this.svgWidth]);
        this.y2Scale = d3.scaleLinear().range([this.height2, 0]);
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
        this.channelScale = d3.scaleLinear()
            .domain([0,100])
            .range([0,100]);

        // Initializing the data for this chart

        this.data = d3.nest()
            .key(d => d["Date received"])
            .rollup(function (d) {
                return {
                    "Total": d3.sum(d, d => 1),
                    "TimelyResponse": d3.sum(d, d => d["Timely response?"] == "Yes" ? 1 : 0),
                    "Disputed": d3.sum(d, d => d["Consumer disputed?"] == "Yes" ? 1 : 0),
                    "Fax": d3.sum(d, d => d["Submitted via"] == "Fax" ? 1 : 0),
                    "Web": d3.sum(d, d => d["Submitted via"] == "Web" ? 1 : 0),
                    "Referral": d3.sum(d, d => d["Submitted via"] == "Referral" ? 1 : 0),
                    "Phone": d3.sum(d, d => d["Submitted via"] == "Phone" ? 1 : 0),
                    "Postal": d3.sum(d, d => d["Submitted via"] == "Postal mail" ? 1 : 0),
                    "Mail": d3.sum(d, d => d["Submitted via"] == "Mail" ? 1 : 0)
                }
            }).entries(allComplaintsData);

        this.contextdata = d3.nest()
            .key(function (d) {
                let splitDate = d["Date received"].split("/");
                return splitDate[0]+"/"+splitDate[2];
            })
            .rollup(function(d) {
                return {
                    "Total": d3.sum(d, d => 1),
                    "TimelyResponse": d3.sum(d, d => d["Timely response?"]=="Yes" ? 1: 0 ),
                    "Disputed": d3.sum(d, d => d["Consumer disputed?"]=="Yes" ? 1: 0 ),
                    "Fax": d3.sum(d, d => d["Submitted via"]=="Fax" ? 1: 0 ),
                    "Web": d3.sum(d, d => d["Submitted via"]=="Web" ? 1: 0 ),
                    "Referral": d3.sum(d, d => d["Submitted via"]=="Referral" ? 1: 0 ),
                    "Phone": d3.sum(d, d => d["Submitted via"]=="Phone" ? 1: 0 ),
                    "Postal": d3.sum(d, d => d["Submitted via"]=="Postal mail" ? 1: 0 ),
                    "Mail": d3.sum(d, d => d["Submitted via"]=="Mail" ? 1: 0 )
                }
            }).entries(allComplaintsData);



    }

    /**
     * Creates a chart with circles representing each election year, populates text content and other required elements for the Year Chart
     */
    update() {

        let self = this;

        this.data.sort(function (a, b) {
            return d3.ascending(self.parseTime(a.key), self.parseTime(b.key));
        });

        this.contextdata.sort(function (a, b) {
            return d3.ascending(self.parseTimeContext(a.key), self.parseTimeContext(b.key));
        });

        this.colorScale.domain(d3.keys(this.data[0].value));
        // this.color2Scale.domain(d3.keys(this.data[0].value));
        this.xScale.domain(d3.extent(this.data, function (d) {
            return self.parseTime(d.key)
        }));
        this.yScale.domain([0, d3.max(this.data, d => d.value.Total)]);
        this.x2Scale.domain(d3.extent(this.contextdata, function (d) {
            return self.parseTimeContext(d.key)
        }));
        this.y2Scale.domain([0, d3.max(this.contextdata, d => d.value.Total)]);


        let xAxis = d3.axisBottom(this.xScale),
            xAxis2 = d3.axisBottom(this.x2Scale),
            yAxis = d3.axisLeft(this.yScale);

        let yGrid = d3.axisLeft(this.yScale)
            .ticks(5);

        let brush = d3.brushX()
            .extent([[0, 0], [this.svgWidth, this.height2]])
            .on("brush end", brushed);

        let zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [this.svgWidth, this.height1]])
            .extent([[0, 0], [this.svgWidth, this.height1]])
            .on("zoom", zoomed);

        let line = d3.line()
            .defined(function (d) {
                return !isNaN(d.total);
            })
            .curve(d3.curveLinear)
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.total));

        let line2 = d3.line()
            .defined(function (d) {
                return !isNaN(d.total);
            })
            .curve(d3.curveLinear)
            .x(d => this.x2Scale(d.date))
            .y(d => this.y2Scale(d.total));

        this.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.svgWidth)
            .attr("height", this.height1);

        let sources = this.colorScale.domain().map(function (name) {
            return {
                name: name,
                values: self.data.map(function (d) {
                    return {date: self.parseTime(d.key), total: +d.value[name]};
                })
            };
        });

        let legends = this.legendSVG.selectAll("g")
            .data(sources);

        let legendsEnter = legends.enter().append("g");

        legendsEnter.append("circle")
            .attr("cx", (d,i) => i*120 + 130)
            .attr("cy", 10 )
            .attr("r", 5)
            .attr("class", d => "category"+d.name)
            .style("fill", d => this.colorScale(d.name))
            .style("opacity", 0.5)
            .on("mouseover", highlight)
            .on("mouseout", highlightDisable());

        legendsEnter.append("text")
            .attr("x", (d,i) => i*120 + 145)
            .attr("y", 15)
            .attr("class", d => "category"+d.name)
            .text(d => d.name)
            .style("opacity", 0.5)
            .on("mouseover", highlight)
            .on("mouseout", highlightDisable);

        function highlight(d) {
            let sel = ".category"+d.name;
            let check = d3.selectAll(sel)
                .classed("selectedCategory", true);
        }

        function highlightDisable(d) {
            d3.selectAll(".selectedCategory")
                .classed("selectedCategory", false);
        }

        let sourcesContext = this.colorScale.domain().map(function (name) {
            return {
                name: name,
                values: self.contextdata.map(function (d) {
                    return {date: self.parseTimeContext(d.key), total: +d.value[name]};
                })
            };
        });

        let focus = this.svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        let context = this.svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + this.margin.bottom + this.height1) + ")");

        let focuslineGroups = focus.selectAll("g")
            .data(sources)
            .enter().append("g");

        focus.append("g")
            .attr("class", "grid")
            .call(yGrid
                .tickSize(-this.svgWidth)
                .tickFormat(""));

        let focuslines = focuslineGroups.append("path")
            .attr("class", d => "line category"+d.name)
            .attr("d", d => line(d.values))
            .style("stroke", d => this.colorScale(d.name))
            .attr("opacity", "0.5")
            .attr("clip-path", "url(#clip)");

        focus.append("g")
            .attr("class", "xAxis axis")
            .attr("transform", "translate(0," + (this.height1) + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "yAxis axis")
            .call(yAxis);

        // Tooltip code for focus chart

        let focusTooltip = focuslineGroups.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focusTooltip.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", this.height1);

        focusTooltip.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", this.svgWidth)
            .attr("x2", this.svgWidth);

        let channelBarGrp = this.tooltipDiv.append("svg")
            .attr("height", 110)
            .append("g")
            .style("display", "none");

        focusTooltip.append("text")
            .attr("x", 15)
            .attr("dy", ".31em")
            .attr("text-anchor", "end");

        let bisectDate = d3.bisector(function(d) { return self.parseTime(d.key); }).left;

        function mousemove() {
            let x0 = self.xScale.invert(d3.mouse(this)[0]),
                i = bisectDate(self.data, x0, 1),
                d0 = self.data[i - 1],
                d1 = self.data[i],
                d = x0 - d0.key > d1.key - x0 ? d1 : d0;

            focusTooltip.attr("transform", "translate(" + self.xScale(self.parseTime(d.key)) + ",0)");

            self.tooltipSpan.html("Submission Stats : " + d.key);
            updateChannel(d);
            self.tooltipDiv
                .style("left", function() {
                    if (d3.event.pageX > self.svgWidth - 220)
                        return (d3.event.pageX - 200) + "px";
                    return (d3.event.pageX + 10) + "px"
                })
                .style("top", 100 + "px");

            focusTooltip.select(".x-hover-line").attr("y2", self.height1);
            focusTooltip.select(".y-hover-line").attr("x2", self.svgWidth + self.svgWidth);
        }

        function mouseover() {
            self.tooltipDiv.transition()
                .duration(200)
                .style("opacity", .9);

            focusTooltip.style("display", null);
            channelBarGrp.style("display", null);
        }

        function mouseout() {
            self.tooltipDiv.transition()
                .duration(200)
                .style("opacity", 0);

            focusTooltip.style("display", "none");
            channelBarGrp.style("display", "none");
        }

        function getMessage(d) {
            return "Received via : " + "<br>" +
                "Web : " + (d.value.Web * 100/d.value.Total).toFixed(2) + "%<br>" +
                "Phone : " + (d.value.Phone * 100/d.value.Total).toFixed(2) + "%<br>" +
                "Referral : " + (d.value.Referral * 100/d.value.Total).toFixed(2) + "%<br>" +
                "Postal : " + (d.value.Postal * 100/d.value.Total).toFixed(2) + "%<br>" +
                "Fax : " + (d.value.Fax * 100/d.value.Total).toFixed(2) + "%<br>" +
                "Mail : " + (d.value.Mail * 100/d.value.Total).toFixed(2) + "%<br>"
        }

        function generateTooltipData(d){
            let data = [];
            data.push({"Key": "Web", "Value": (d.value.Web * 100/d.value.Total).toFixed(2)});
            data.push({"Key": "Phone", "Value": (d.value.Phone * 100/d.value.Total).toFixed(2)});
            data.push({"Key": "Referral", "Value": (d.value.Referral * 100/d.value.Total).toFixed(2)});
            data.push({"Key": "Postal", "Value": (d.value.Postal * 100/d.value.Total).toFixed(2)});
            data.push({"Key": "Fax", "Value": (d.value.Fax * 100/d.value.Total).toFixed(2)});
            // data.push({"Key": "Mail", "Value": (d.value.Mail * 100/d.value.Total).toFixed(2)});
            return data;
        }

        function updateChannel(d){
            let barGroups = channelBarGrp.selectAll(".barGroup").data(generateTooltipData(d));
            let barGroupsEnter = barGroups.enter()
                .append("g")
                .classed("barGroup", true);

            barGroups.exit().remove();

            barGroupsEnter.append("rect")
                .attr("width", "0")
                .attr("height", 20)
                .style("fill", "red");

            barGroupsEnter.append("text");

            barGroups = barGroups.merge(barGroupsEnter);

            barGroups.attr("transform", function (d, i) {
                return "translate(0," + (i * 21 + 5) + ")";
            });

            barGroups.select("rect")
                .transition().duration(200)
                .attr("width", function (d) {
                    return self.channelScale(d.Value);
                })
                .style("fill", "steelblue")
                .attr("opacity", 1);

            barGroups.select("text")
                .attr("transform", function (d) {
                    return "translate(" + (self.channelScale(d.Value) + 5) + ", 0)";
                })
                .text(function (d) {
                    return d.Key + " (" + d.Value + "%)";
                })
                .attr("dy", 18)
                .attr("opacity", 0)
                .transition()
                .duration(200)
                .attr("opacity", 1);

        }

        let contextlineGroups = context.selectAll("g")
            .data(sourcesContext)
            .enter().append("g");

        let contextLines = contextlineGroups.append("path")
            .attr("class", d => "line category"+d.name)
            .transition()
            .duration(2000)
            .attr("d", d => line2(d.values))
            .style("stroke", d => this.colorScale(d.name))
            .attr("clip-path", "url(#clip)");

        context.append("g")
            .attr("class", "xAxis axis")
            .attr("transform", "translate(0," + (this.height2) + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", this.height2 + 7);

        this.svg.append("rect")
            .attr("class", "zoom")
            .attr("width", this.svgWidth)
            .attr("height", this.height1)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .call(zoom);

        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
            let s = d3.event.selection || self.x2Scale.range();
            self.xScale.domain(s.map(self.x2Scale.invert, self.x2Scale));
            focus.selectAll(".line").attr("d", d => line(d.values));
            focus.select(".xAxis").call(xAxis);

            self.svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(self.svgWidth / (s[1] - s[0]))
                .translate(-s[0], 0))
            ;

            // Applying year filter
            let yearRange = d3.event.selection.map(self.xScale.invert);
            window.filters.Start = yearRange[0];
            window.filters.End = yearRange[1];
            callUpdate();
        }

        function zoomed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
            let t = d3.event.transform;
            self.xScale.domain(t.rescaleX(self.x2Scale).domain());
            focus.selectAll(".line").attr("d", d => line(d.values));
            focus.select(".xAxis").call(xAxis);
            context.select(".brush").call(brush.move, self.xScale.range().map(t.invertX, t));
        }


        let sleeping = false;

        function callUpdate() {
            if (!sleeping) {
                sleeping = true;
                setTimeout(function () {
                    window.updateFilters();
                    sleeping = false;
                }, 500);
            }


        }
    }
}

