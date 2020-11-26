let bm = BikeStationManager;
let mm = MapManager;
let v = new Vue({
	el: '#app',
	data: {
		dragValue: null,
		range: {
			start: new Date((new Date()).setMinutes((new Date()).getMinutes() - 180)),
			end: new Date(),
		},
		sortkey: 'relative_retren_sum_delta',
		sortkeys: [
			'relative_retren_sum_delta',

			'rel_delta',
			'rel_now', 
			'rel_before', 

			'retren_sum_delta', 
			'retren_sum_now', 
			'retren_sum_before', 

			'retren_sub_delta', 
			'retren_sub_now', 
			'retren_sub_before', 

			'returns_delta', 
			'returns_now', 
			'returns_before', 

			'rentals_delta', 
			'rentals_now', 
			'rentals_before' 
		],
		timedelay: 604800,
		status_message: '',
		item_selection: '',
		top_transaction_percentage: 5,
		is_range_updated: true,
		render_chart: true,
		render_map: true,
		showLine: true,
		before: null,
		now: null,
		stations: null,
		map_show_bike_roads: true,
		map_show_district: false,
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
			this.timedelay = parseInt(this.timedelay);
			if( !Number.isInteger(this.timedelay) ) this.timedelay = 604800;
			if( this.timedelay < 0 ) this.timedelay = 0;
			this.debouncedUpdateSlow();
		},
		sortkey: function(e){
			this.set_status_message('정렬키 입력 대기 중');
			this.debouncedUpdate();
		},
		item_selection: function(e){
			this.set_status_message('특정 대여소 선택 입력 대기 중');
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
		map_show_bike_roads: function(e){
			this.update_map_overlay();
		},
		map_show_district: function(e){
			this.update_map_overlay();
		},
	},

	async created(){
		this.debouncedUpdate = _.debounce(this.update_results, 500);
		this.debouncedUpdateSlow = _.debounce(this.update_results, 4000);
		await this.update_results();
		this.update_stations(this.now);
	},

	mounted(){
		mm.render_map();
		this.update_map_overlay();
	},

	methods: {
		update_stations(now){
			this.stations = []
			for(const key in now){
				this.stations.push([now[key].name, key]);
			}
			this.stations.sort(function(a,b){ if(a[0] > b[0]) return 1; else if (b[0] > a[0]) return -1; else return 0; });
			this.stations.unshift(['', '']);
		},
		update_map_overlay(){
			mm.map.removeOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE);
			mm.map.removeOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
			if( this.map_show_district ) mm.map.addOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
			if( this.map_show_bike_roads ) mm.map.addOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE);
		},

		// 정렬이 되어있다고 가정하고 이용
		set_stations_into_map(rating){
			mm.clear_map();
			const min = rating[0][this.sortkey];
			const max = rating[rating.length - 1][this.sortkey];
			let from_size = 10;
			let to_size = 400;
			let mid_size = (to_size - from_size)/2
			/*
			if(min < 0){
				from_size = 200;
				mid_size = 10;
				to_size = 200;
			}
			*/
			let min_size = 99999;
			let max_size = 0;
			for(let i=0; i<rating.length; i++){
				let retren_sum_all = rating[i]['retren_sum_now'] + rating[i]['retren_sum_before'];
				if( min_size > retren_sum_all ) min_size = retren_sum_all;
				if( max_size < retren_sum_all ) max_size = retren_sum_all;
			}
			for(let i=0; i<rating.length; i++){
				//weight는 0 과 1 사이의 값을 가진다
				let color_weight = 0;
				let size_weight = 0;
				if( min < 0){
					let larger = Math.abs(max);
					if(Math.abs(max) < Math.abs(min)) larger = Math.abs(min);
					color_weight = (rating[i][this.sortkey] / larger) * .5 + .5;
				}
				else{
					color_weight = rating[i][this.sortkey] / max;
				}

				//size_weight = (rating[i]['retren_sum_now'] + rating[i]['retren_sum_before'] - min_size)**.5/(max_size - min_size)**.5;
				size_weight = (rating[i]['retren_sum_now'] + rating[i]['retren_sum_before'] - min_size)/(max_size - min_size);
				
				mm.add_circle(parseFloat(rating[i]["latitude"]), parseFloat(rating[i]["longitude"]), '#0000FF', '#FF0000', from_size, mid_size, to_size, color_weight, size_weight)
				//mm.add_infowindow(parseFloat(rating[i]["latitude"]), parseFloat(rating[i]["longitude"]), rating[i]["name"], rating[i]["id"])
			}
		},

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
		get_push_item(before, now, key){
			return {
					'id':key,
					'name':now[key]['name'],
					'relative_retren_sum_delta':(bm.getReturnCount(now[key]) + bm.getRentalCount(now[key]) - bm.getReturnCount(before[key]) - bm.getRentalCount(before[key]))/(bm.getReturnCount(now[key]) + bm.getRentalCount(now[key]) + bm.getReturnCount(before[key]) + bm.getRentalCount(before[key])),

					'rel_delta':bm.getRelation(now[key], now) - bm.getRelation(before[key], before),
					'rel_now':bm.getRelation(now[key], now),
					'rel_before':bm.getRelation(before[key], before),

					'retren_sum_delta': (bm.getRentalCount(now[key]) + bm.getReturnCount(now[key])) - (bm.getRentalCount(before[key]) + bm.getReturnCount(before[key])),
					'retren_sum_now': bm.getRentalCount(now[key]) + bm.getReturnCount(now[key]),
					'retren_sum_before': bm.getRentalCount(before[key]) + bm.getReturnCount(before[key]),

					'retren_sub_delta': (bm.getRentalCount(now[key]) - bm.getReturnCount(now[key])) - (bm.getRentalCount(before[key]) - bm.getReturnCount(before[key])),
					'retren_sub_now': bm.getRentalCount(now[key]) - bm.getReturnCount(now[key]),
					'retren_sub_before': bm.getRentalCount(before[key]) - bm.getReturnCount(before[key]),

					'returns_delta':bm.getReturnCount(now[key]) - bm.getReturnCount(before[key]),
					'returns_now':bm.getReturnCount(now[key]),
					'returns_before':bm.getReturnCount(before[key]),

					'rentals_delta':bm.getRentalCount(now[key]) - bm.getRentalCount(before[key]),
					'rentals_now':bm.getRentalCount(now[key]),
					'rentals_before':bm.getRentalCount(before[key]),

					'latitude':now[key]['latitude'],
					'longitude':now[key]['longitude'],
				}
		},
		get_rating(before, now, exclusive_items = [], inclusive_items = null){
			let rating = [];
			if(inclusive_items == null){
				for(const key in now){
					if(!(key in before)) continue;
					if(! exclusive_items.includes(key)) continue;
					rating.push( this.get_push_item(before, now, key));
				}
			} else{
				for(let i=0; i<inclusive_items.length; i++){
					if(!(inclusive_items[i] in before)) continue;
					if(!(inclusive_items[i] in now)) continue;
					rating.push( this.get_push_item(before, now, inclusive_items[i]));
				}
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
			let in_ids = null;
			if(this.item_selection != '') in_ids = [this.item_selection];
			let rating = this.get_rating(this.before, this.now, bm.get_high_transaction_ids(this.now, this.top_transaction_percentage), in_ids);
			this.sort_rating(rating, this.sortkey, true);
			console.log(rating);
			this.set_and_update_chart(rating);
			this.set_stations_into_map(rating);
			this.set_status_message();
		},
		set_status_message(msg = ''){
			this.status_message = msg;
		},
	},
});
