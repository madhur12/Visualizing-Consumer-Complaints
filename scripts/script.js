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
    window.performanceObj = new PerformanceChart(allComplaintsData);
    performanceObj.updateCompanies('Total');
    timelineObj.update();
});

function chooseData() {
    var x = document.getElementById("inds");
    var index = x.options[x.selectedIndex].value;
    if (index == "Total") {
        performanceObj.updateCompanies('Total');
    }
    else if (index == "Disputed") {
        performanceObj.updateCompanies('Disputed');
    }
    else if (index == "Timely") {
        performanceObj.updateCompanies('Timely');
    }
    else if (index == "PercentDisputed") {
        performanceObj.updateCompanies('PercentDisputed');
    }
    else if (index == "PercentTimely") {
        performanceObj.updateCompanies('PercentTimely');
    }
}