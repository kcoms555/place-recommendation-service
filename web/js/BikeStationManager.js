//const fetch = require("node-fetch");
class BikeStationManager {
	static async getBikes(from, to){
		if(BikeStationManager.bikeStationInfo == null) await BikeStationManager.__updateStationInfo();
		let stations = JSON.parse(JSON.stringify(BikeStationManager.bikeStationInfo));
		const items = await BikeStationManager.__getBikes(from, to);
		for(let i = 0; i<items.length; i++){
			const item = items[i];
			const id = item["stationId"];
			stations[id]["logs"].push([ item["timestamp"], item["total"], item["parking"], item["shared"] ]);
		}
		return stations;
	}
	static async __updateStationInfo(){
		console.log('updating bikeStationInfo');
		BikeStationManager.bikeStationInfo = {};
		const res = await BikeStationManager.__fetch(`/bike_station_info`);
		
		//거치대 정보 추가
		for(let i = 0; i<res.length; i++){
			const id = res[i]["stationId"];
			if( id in BikeStationManager.bikeStationInfo) continue;
			BikeStationManager.bikeStationInfo[id] = {};
			BikeStationManager.bikeStationInfo[id]["name"] = res[i]["stationName"];
			BikeStationManager.bikeStationInfo[id]["latitude"] = res[i]["stationLatitude"];
			BikeStationManager.bikeStationInfo[id]["longitude"] = res[i]["stationLongitude"];
			BikeStationManager.bikeStationInfo[id]["logs"] = [];
			BikeStationManager.bikeStationInfo[id]["adjacent"] = [];
		}

		//인접 거치대 계산
		for(let start_key in BikeStationManager.bikeStationInfo){
			const s_y = parseFloat(BikeStationManager.bikeStationInfo[start_key]["latitude"]);
			const s_x = parseFloat(BikeStationManager.bikeStationInfo[start_key]["longitude"]);
			for(let end_key in BikeStationManager.bikeStationInfo){
				if(start_key == end_key) continue;
				const e_y = parseFloat(BikeStationManager.bikeStationInfo[end_key]["latitude"]);
				const e_x = parseFloat(BikeStationManager.bikeStationInfo[end_key]["longitude"]);
				const distance = get_distance(s_x, s_y, e_x, e_y);
				//2000m 이내 모두 구한다
				if(distance < 2000) BikeStationManager.bikeStationInfo[start_key]["adjacent"].push([end_key, distance]);
			}
			BikeStationManager.bikeStationInfo[start_key]["adjacent"].sort(function(a,b){ return a[1] - b[1];});
			while(BikeStationManager.bikeStationInfo[start_key]["adjacent"].length > 16) BikeStationManager.bikeStationInfo[start_key]["adjacent"].pop();
		}
	}
	static async __getBikes(from, to){
		if( from * to <= 0 ) throw(`getBikes : from and to should have same signs, now : ${from}, ${to}`)
		return await BikeStationManager.__fetch(`/bikes/${from}/${to}`);
	}
	static async __fetch(path) {
		console.log(`send to https://jeto.ga/api/softapp${path}`);
		const res = await fetch(`https://jeto.ga/api/softapp${path}`);
		return await res.json();
	}
	static get_high_transaction_ids(stations, percentage){
		lists = []
		for(const key in stations){
			const sum = BikeStationManager.getRentalCount(stations[key]) + BikeStationManager.getReturnCount(stations[key]);
			lists.push([key, sum]);
		}
		lists.sort(function(a,b){return b[1] - a[1];});
		ids = [];
		for(let i=0; i<Object.keys(stations).length*(percentage/100); i++) ids.push(lists[i][0]);
		return ids;
	},
	static get_low_transaction_ids(stations, percentage){
		lists = []
		for(const key in stations){
			const sum = BikeStationManager.getRentalCount(stations[key]) + BikeStationManager.getReturnCount(stations[key]);
			lists.push([key, sum]);
		}
		lists.sort(function(a,b){return a[1] - b[1];});
		ids = [];
		for(let i=0; i<Object.keys(stations).length*(percentage/100); i++) ids.push(lists[i][0]);
		return ids;
	},
	static getReturnCount(station){
		let returncount = 0;
		for(let i=0; i<station['logs'].length -1; i++){
			let val = station['logs'][i+1][2] - station['logs'][i][2];
			if(val>0) returncount += val;
		}
		return returncount;
	}
	static getRentalCount(station){
		let rentalcount = 0;
		for(let i=0; i<station['logs'].length -1; i++){
			let val = station['logs'][i+1][2] - station['logs'][i][2];
			if(val<0) rentalcount -= val;
		}
		return rentalcount;
	}
	static getRelation(target_station, stations){
		let cnt_return = 0;
		let cnt_rental = 0;

		// 2.1. neighbors에서 발생한 반납은 self에서 대여가 발생한 것과 동일하게 평가합니다.
		// 2.2. neighbors에서 발생한 대여는 self에서 반납이 발생한 것과 동일하게 평가합니다.
		for(let i=0; i<target_station["adjacent"].length; i++){
			cnt_rental += BikeStationManager.getReturnCount(stations[target_station["adjacent"][i][0]]);
			cnt_return += BikeStationManager.getRentalCount(stations[target_station["adjacent"][i][0]]);
		}

		// 2.3. self의 반납 건수를 cnt_return, 대여 건수를 cnt_rental 이라고 합니다.
		cnt_return += BikeStationManager.getReturnCount(target_station);
		cnt_rental += BikeStationManager.getRentalCount(target_station);

		//2.4. relation은 다음과 같이 계산합니다. relation = (cnt_return - cnt_rental)/(neighbors와 self의 전체 반납/대여 횟수)
		if( (cnt_return + cnt_rental) == 0 ) return 0;
		return (cnt_return - cnt_rental)/(cnt_return + cnt_rental);
	}
}
BikeStationManager.bikeStationInfo = null;
