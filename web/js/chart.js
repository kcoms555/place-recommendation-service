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
