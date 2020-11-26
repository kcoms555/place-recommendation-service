/*
class CustomChart{
	static chart = null;
	static get_chart(){
		if(this.chart) return this.chart;
		this.chart = new Chart(document.getElementById("line-chart"), {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			options: {
				title: {
					display: true,
					text: '실시간 따릉이 이용 데이터'
				},
				spanGaps: true,
				maintainAspectRatio: false
			}
		});
		return this.chart;
	}
}
Chart.pluginService.register({
    afterDraw: function(chart) {
		console.log('hi');
        if (typeof chart.config.options.lineAt != 'undefined') {
            var lineAt = chart.config.options.lineAt;
            var ctxPlugin = chart.chart.ctx;
            var xAxe = chart.scales[chart.config.options.scales.xAxes[0].id];
            var yAxe = chart.scales[chart.config.options.scales.yAxes[0].id];
			console.log(chart)
            ctxPlugin.strokeStyle = "red";
            ctxPlugin.beginPath();
            lineAt = yAxe.getPixelForValue(lineAt);
            ctxPlugin.moveTo(xAxe.left, lineAt);
            ctxPlugin.lineTo(xAxe.right, lineAt);
            ctxPlugin.stroke();
        }
    }
});
*/
let chart = new Chart(document.getElementById("line-chart"), {
	type: 'line',
	data: {
		labels: [],
		datasets: []
	},
	options: {
		title: {
			display: true,
			text: '실시간 따릉이 이용 데이터'
		},
		showLines: false,
		spanGaps: true,
		maintainAspectRatio: false
	}
});
