/**
 * Created by Madhur on 11/8/2017.
 */

//load the data corresponding to all the election years
//pass this data and instances of all the charts that update on year selection to yearChart's constructor
console.log("Data Read Starting");
d3.csv("data/Complaints_new.csv", function (error, allComplaintsData) {
    if (error) throw error;
    console.log("Data Read Complete");
    window.allData = allComplaintsData;

    // Set these filters to appropriate value to update views
    window.filters = {
        "Start": null,
        "End": null,
        "Product": null,
        "Company": null,
        "State": null
    }
    d3.csv("data/map.csv", function (error, statesData) {
        window.mapObj = new Map(statesData);
        window.timelineObj = new Timeline(allComplaintsData);
        window.sunburstObj = new Sunburst();
        window.performanceObj = new PerformanceChart();
        timelineObj.update();
        window.updateFilters();
    });
});



function updateFilters(){
    callUpdates();
    let applied = [];

    for (let filter in filters){
        if (window.filters[filter] != null)
            if (filter == "Start"){
                let dateStr = window.filters.Start.toString('dd-MMM-yyyy') + ' to ' + window.filters.End.toString('dd-MMM-yyyy');
                applied.push({"key":filter, "value": dateStr});
            }
            else if (filter != "End"){
                applied.push({"key":filter, "value":window.filters[filter]});
            }
    }

    let filterList = d3.select("#filters")
        .selectAll('li')
        .data(applied);

    let liAdd = filterList.enter().append('li');

    liAdd.append("span");
    liAdd.append("button");

    filterList.exit().remove();

    filterList = liAdd.merge(filterList);

    filterList.select("span")
        .text(d => d.value + "  ");

    filterList.select("button")
        .attr("type", "button")
        .attr("class", "btn btn-outline-secondary")
        .text("X")
        .on("click", removeElement);

    function removeElement(d) {
        window.filters[d.key] = null;
        updateFilters();
    }

    function callUpdates() {
        window.mapObj.updateData();
        window.sunburstObj.updateData();
        window.performanceObj.updateData();
    }

}
