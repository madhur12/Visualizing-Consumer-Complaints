class PerformanceChart {

    constructor(allComplaintsData)
    {
        this.divBestWorst = d3.select("#best-worst");

        // Initializes the svg elements required for this chart
        this.margin = {top: 10, right: 20, bottom: 30, left: 50};
        this.svgBounds = this.divBestWorst.node().getBoundingClientRect();
        this.svgWidth = this.svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = 500;

        this.svg = this.divBestWorst
            .append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);





        //Initializing the data for this chart
        this.data = d3.nest()
            .key(d => d["Company"])
            .rollup(function(d) {
                return {
                    "Total": d3.sum(d, d => 1),
                    "SubmittedviaRef": d3.sum(d, d=>d["Submitted via"]=="Referral" ? 1:0),
                    "SubmittedviaPhone": d3.sum(d, d=>d["Submitted via"]=="Phone" ? 1:0),
                    "SubmittedviaPost": d3.sum(d, d=>d["Submitted via"]=="Postal mail" ? 1:0),
                    "SubmittedviaMail": d3.sum(d, d=>d["Submitted via"]=="Mail" ? 1:0),
                    "SubmittedviaFax": d3.sum(d, d=>d["Submitted via"]=="Fax" ? 1:0),
                    "SubmittedviaWeb": d3.sum(d, d=>d["Submitted via"]=="Web" ? 1:0),
                    "Timely": d3.sum(d, d => d["Timely response?"]=="Yes" ? 1: 0 ),
                    "Disputed": d3.sum(d, d => d["Consumer disputed?"]=="Yes" ? 1: 0 )
                }
            }).entries(allComplaintsData);

    }

    updateCompanies() {

        let self = this;
        var data = self.data;
        var padding = 50;

        var g1 = self.svg.append("g").attr("transform", "translate(20,10)");
        var g2 = self.svg.append("g").attr("transform", "translate(20,10)");
        var y = d3.scaleBand()
            .domain(data.map(function (d) {return d.key;}))
            .range([0,self.svgHeight]);

        let x = d3.scaleLinear()
            .domain([0, d3.max(data ,function(d){
                return d.value.Total})])
            .range([0,self.svgWidth])
            .nice();

        let yAxis = d3.axisLeft()
            .scale(y);
        let xAxis = d3.axisBottom()
            .scale(x);

       g1.append("g")
           .attr("transform", "translate(" + padding +","+ 0 +")")
           .call(yAxis);

       g2.append("g")
            .attr("transform", "translate(" + padding + "," + (self.svgHeight - padding) + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.4em")
            .attr("dy", "-.20em")
            .attr("transform", function(d) {
                return "rotate(-90)"
            });


        var barSelection = self.svg.append("g").attr("transform", "translate(20,10)");
        var rectSelect = barSelection.selectAll("rect").data(data);
        var newbars =  rectSelect.enter().append("rect");
        rectSelect.exit().remove();
        rectSelect = newbars.merge(rectSelect);
        rectSelect
            .transition().duration(1500)
            .attr("x", padding)
            .attr("y",function (d,i) {
                console.log(d)
                    return ((self.svgHeight- padding)/3000)*i;
            })
            .attr("width",function (d, i) {
                return x(d.value.Total);
            })
            .attr("height",function (d) {
                return (self.svgHeight- padding)/3000;
            })
            .style("fill","yellow")
            .style("stroke","darkgray")
            .style("stroke-width","1px");
    }
}
