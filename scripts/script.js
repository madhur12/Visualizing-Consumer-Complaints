/**
 * Created by Madhur on 11/8/2017.
 */

//load the data corresponding to all the election years
//pass this data and instances of all the charts that update on year selection to yearChart's constructor
console.log("Data Read Starting");
d3.csv("data/Complaints_new.csv", function (error, allComplaintsData) {
    if (error) throw error;
    console.log("Data Read Complete");
    let timelineObj = new Timeline(allComplaintsData);
    let performanceObj = new PerformanceChart(allComplaintsData);
    performanceObj.updateCompanies();
    timelineObj.update();
});