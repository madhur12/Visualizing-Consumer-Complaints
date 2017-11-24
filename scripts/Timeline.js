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
        this.svg = this.divTimeLine
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);

        // Initializing the Time parser and Scales
        this.parseTime = d3.timeParse("%m/%d/%Y");

        this.xScale = d3.scaleTime().range([0, this.svgWidth]);
        this.yScale = d3.scaleLinear().range([this.height1, 0]);
        this.x2Scale = d3.scaleTime().range([0, this.svgWidth]);
        this.y2Scale = d3.scaleLinear().range([this.height2, 0]);
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Initializing the data for this chart

        this.data = d3.nest()
            .key(d => d["Date received"])
            .rollup(function(d) {
                return {
                    "Total": d3.sum(d, d => 1),
                    "Timely": d3.sum(d, d => d["Timely response?"]=="Yes" ? 1: 0 ),
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

        console.log(this.data);
        let self = this;

        this.data.sort(function (a,b) {
            return d3.ascending(self.parseTime(a.key), self.parseTime(b.key));
        });

        this.colorScale.domain(d3.keys(this.data[0].value));
        this.xScale.domain(d3.extent(this.data, function(d){
            return self.parseTime(d.key)
        }));
        this.yScale.domain([0, d3.max(this.data, d => d.value.Total)]);
        this.x2Scale.domain(this.xScale.domain());
        this.y2Scale.domain(this.yScale.domain());

        console.log(this.xScale.domain(), d3.extent(this.data, d => d.key=="null" ? new Date() : d.key));

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
            .defined(function(d) { return !isNaN(d.total); })
            .curve(d3.curveLinear)
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.total));

        let line2 = d3.line()
            .defined(function(d) { return !isNaN(d.total); })
            .curve(d3.curveLinear)
            .x(d => this.x2Scale(d.date))
            .y(d => this.y2Scale(d.total));

        this.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.svgWidth)
            .attr("height", this.height1);

        let sources = this.colorScale.domain().map(function(name) {
            return {
                name: name,
                values: self.data.map(function (d) {
                    return {date: self.parseTime(d.key), total: +d.value[name]};
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
            .attr("class","line")
            .attr("d", d => line(d.values))
            .style("stroke", d => this.colorScale(d.name))
            .attr("clip-path", "url(#clip)");

        focus.append("g")
            .attr("class", "xAxis axis")
            .attr("transform", "translate(0," + (this.height1) + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "yAxis axis")
            .call(yAxis);

        let contextlineGroups = context.selectAll("g")
            .data(sources)
            .enter().append("g");

        let contextLines = contextlineGroups.append("path")
            .attr("class", "line")
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
            .call(zoom);

        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
            let s = d3.event.selection || self.x2Scale.range();
            self.xScale.domain(s.map(self.x2Scale.invert, self.x2Scale));
            focus.selectAll(".line").attr("d", d => line(d.values));
            focus.select(".xAxis").call(xAxis);
            self.svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                .scale(self.svgWidth / (s[1] - s[0]))
                .translate(-s[0], 0));
        }

        function zoomed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
            let t = d3.event.transform;
            self.xScale.domain(t.rescaleX(self.x2Scale).domain());
            focus.selectAll(".line").attr("d", d => line(d.values));
            focus.select(".xAxis").call(xAxis);
            context.select(".brush").call(brush.move, self.xScale.range().map(t.invertX, t));
            console.log(d3.event.transform.k);
        }

    }
}
