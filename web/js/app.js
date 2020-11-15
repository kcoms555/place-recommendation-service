let bm = BikeStationManager;
let mapManager = MapManager;
let v = new Vue({
	el: '#app',
	data: {
		dragValue: null,
		range: {
			start: new Date((new Date()).setMinutes((new Date()).getMinutes() - 180)),
			end: new Date(),
		},
		sortkey: 'retren_delta',
		sortkeys: [
			'value',
			'rel_delta',
			'rel_now', 
			'rel_before', 

			'retren_delta', 
			'retren_now', 
			'retren_before', 

			'returns_delta', 
			'returns_now', 
			'returns_before', 

			'rentals_delta', 
			'rentals_now', 
			'rentals_before' 
		],
		timedelay: 604800,
		status_message: '',
		top_transaction_percentage: 5,
		is_range_updated: true,
		render_chart: true,
		render_map: true,
		showLine: true,
		before: null,
		now: null,
	},
	computed: {
		selectDragAttribute() {
			return {
				popover: {
					visibility: 'hover',
					isInteractive: false,
				}
			};
		}
	},
	watch: {
		range: function(e){
			this.set_status_message('시간 조회 범위 입력 대기 중');
			this.is_range_updated = true;
			this.debouncedUpdate();
		},
		timedelay: function(e){
			this.set_status_message('시간 조회 범위 입력 대기 중');
			this.debouncedUpdateSlow();
		},
		sortkey: function(e){
			this.set_status_message('정렬키 입력 대기 중');
			this.debouncedUpdate();
		},
		top_transaction_percentage: function(e){
			this.set_status_message('조사 대여소 비율 입력 대기 중');
			this.top_transaction_percentage = parseInt(this.top_transaction_percentage);
			if( !Number.isInteger(this.top_transaction_percentage) ) this.top_transaction_percentage = 5;
			if( this.top_transaction_percentage < 0 ) this.top_transaction_percentage = 0;
			if( this.top_transaction_percentage > 100 ) this.top_transaction_percentage = 100;
			this.debouncedUpdate();
		},
		showLine: function(e){
			this.set_status_message('차트 설정 입력 대기 중');
			this.debouncedUpdate();
		},
	},

	async created(){
		this.debouncedUpdate = _.debounce(this.update_results, 500);
		this.debouncedUpdateSlow = _.debounce(this.update_results, 4000);
		await this.update_results();
	},

	methods: {
		set_and_update_chart(rating){
			if(rating.length == 0) return;

			var labels = [];
			for(let i=0; i<rating.length; i++) labels.push(rating[i]['name']);

			var datasets = [];
			for(let i=0; i<this.sortkeys.length; i++){
				const tmp = {};
				tmp["borderColor"] = colorlist[i];
				tmp["fill"] = false;
				tmp["label"] = this.sortkeys[i];
				tmp["data"] = [];
				tmp["showLine"] = this.showLine;

				for(let j=0; j<rating.length; j++) tmp["data"].push(rating[j][this.sortkeys[i]]);
				datasets.push(tmp);
			}
			chart.data.labels = labels;
			chart.data.datasets = datasets;
			chart.update();
		},
		get_rating(before, now, exclusive_items){
			let rating = [];
			for(const key in now){
				if(!(key in before)) continue;
				if(! exclusive_items.includes(key)) continue;
				rating.push({
					'id':key,
					'name':now[key]['name'],
					'value':(bm.getReturnCount(now[key]) + bm.getRentalCount(now[key]) - bm.getReturnCount(before[key]) - bm.getRentalCount(before[key]))/(bm.getReturnCount(now[key]) + bm.getRentalCount(now[key]) + bm.getReturnCount(before[key]) + bm.getRentalCount(before[key])),

					'rel_delta':bm.getRelation(now[key], now) - bm.getRelation(before[key], before),
					'rel_now':bm.getRelation(now[key], now),
					'rel_before':bm.getRelation(before[key], before),

					'retren_delta': (bm.getRentalCount(now[key]) - bm.getReturnCount(now[key])) - (bm.getRentalCount(before[key]) - bm.getReturnCount(before[key])),
					'retren_now': bm.getRentalCount(now[key]) - bm.getReturnCount(now[key]),
					'retren_before': bm.getRentalCount(before[key]) - bm.getReturnCount(before[key]),

					'returns_delta':bm.getReturnCount(now[key]) - bm.getReturnCount(before[key]),

					'returns_now':bm.getReturnCount(now[key]),
					'returns_before':bm.getReturnCount(before[key]),

					'rentals_delta':bm.getRentalCount(now[key]) - bm.getRentalCount(before[key]),
					'rentals_now':bm.getRentalCount(now[key]),
					'rentals_before':bm.getRentalCount(before[key]),

					'latitude':now[key]['latitude'],
					'longitude':now[key]['latitude'],
				});
			}
			return rating;
		},
		sort_rating(sort_target, key, is_ascending = false){
			if(is_ascending) sort_target.sort(function(a,b){ return a[key] - b[key]; });
			else sort_target.sort(function(a,b){ return b[key] - a[key]; });
		},
		async update_bikes(){
			this.set_status_message('대여 정보 업데이트 중...');
			this.before = await bm.getBikes(this.range.start.getTime()/1000 - this.timedelay, this.range.end.getTime()/1000 - this.timedelay);
			this.now = await bm.getBikes(this.range.start.getTime()/1000, this.range.end.getTime()/1000);
			this.is_range_updated = false;
			this.set_status_message();
		},
		async update_results(){
			if(this.is_range_updated) await this.update_bikes();
			this.set_status_message('결과 업데이트 중...');
			let rating = this.get_rating(this.before, this.now, bm.get_high_transaction_ids(this.now, this.top_transaction_percentage));
			this.sort_rating(rating, this.sortkey, true);
			this.set_and_update_chart(rating);
			this.set_status_message();
		},
		set_status_message(msg = ''){
			this.status_message = msg;
		},
	},
});
