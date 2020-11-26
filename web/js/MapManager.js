class MapManager{
	static render_map(){
		if(MapManager.map == null){
			const container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
			const options = { //지도를 생성할 때 필요한 기본 옵션
				center: new kakao.maps.LatLng(37.58256149, 127.05436707), //지도의 중심좌표.
					level: 3 //지도의 레벨(확대, 축소 정도)
			};
			MapManager.map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
		}
	}
	static clear_map(){
		if(MapManager.map == null) return;
		for(var i=0; i<MapManager.infowindows.length; i++) MapManager.infowindows[i].close();
		for(var i=0; i<MapManager.markers.length; i++) MapManager.markers[i].setMap(null);
		for(var i=0; i<MapManager.circles.length; i++) MapManager.circles[i].setMap(null);
		MapManager.infowindows = [];
		MapManager.markers = [];
		MapManager.circles = [];
	}
	static add_circle(latitude, longitude, from_color = '#000000', to_color = '#75B8FA', from_size = 10, mid_size = 100, to_size = 200, color_weight = 1.0, size_weight = 1.0){
		console.log(latitude, longitude, from_color, to_color, from_size, mid_size, to_size, color_weight, size_weight);
		const r = rpad(parseInt( parseInt(`0x${from_color[1]}${from_color[2]}`) * (1-color_weight) + parseInt(`0x${to_color[1]}${to_color[2]}`) * color_weight).toString(16), 2, '0');
		const g = rpad(parseInt( parseInt(`0x${from_color[3]}${from_color[4]}`) * (1-color_weight) + parseInt(`0x${to_color[3]}${to_color[4]}`) * color_weight).toString(16), 2, '0');
		const b = rpad(parseInt( parseInt(`0x${from_color[5]}${from_color[6]}`) * (1-color_weight) + parseInt(`0x${to_color[5]}${to_color[6]}`) * color_weight).toString(16), 2, '0');
		const calculated_color = `#${r}${g}${b}`;
		let calculated_size = 100;
		if(size_weight < 0.5) calculated_size = mid_size * (size_weight * 2) + from_size * (1 - size_weight * 2);
		else calculated_size = to_size * (size_weight * 2 - 1) + mid_size * (1 - (size_weight * 2 - 1))
		
		let circle = new kakao.maps.Circle({
			'center': new kakao.maps.LatLng( latitude, longitude ),
			'radius': calculated_size,
			'strokeWeight': 1,
			'strokeColor': calculated_color,
			'strokeOpacity': 1.0,
			'strokeStyle': 'line',
			'fillColor': calculated_color,
			'fillOpacity': 0.9,
		});
		circle.setMap(MapManager.map);
		MapManager.circles.push(circle);
	}
	static add_infowindow(latitude, longitude, name, id=''){
		console.log(latitude, longitude, name, id);
		let infowindow = new kakao.maps.InfoWindow({
			map: MapManager.map,
			position: new kakao.maps.LatLng(latitude, longitude),
			content: `<div style="font-size:small;padding:0.1em;"><h4><a href="https://map.kakao.com/link/map/${name},${latitude},${longitude}" style="" target="_blank">${name}</a></h4></div>`,
			removable: true,
		});
		MapManager.infowindows.push(infowindow);
	}
	static render_stations_into_map(id_list, stations){
		if(MapManager.map == null) MapManager.render_map();
		for(var i=0; i<MapManager.infowindows.length; i++) MapManager.infowindows[i].close();
		for(var i=0; i<MapManager.markers.length; i++) MapManager.markers[i].setMap(null);
		MapManager.infowindows = [];
		MapManager.markers = [];
		const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
		for(var i=0; i<id_list.length; i++){
			var station = stations[id_list[i]];
			var latlng = new kakao.maps.LatLng( parseFloat(station["stationLatitude"]), parseFloat(station["stationLongitude"]))
			var imageSize = new kakao.maps.Size(24, 35); 
			var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize); 

			// 마커를 생성합니다
			var marker = new kakao.maps.Marker({
				map: MapManager.map, // 마커를 표시할 지도
				position: latlng, // 마커를 표시할 위치
				title : station["stationName"], // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
				image : markerImage // 마커 이미지 
			});
			var infowindow = new kakao.maps.InfoWindow({
				position: latlng,
				content: `<div style="font-size:small;padding:0.1em;"><h4><a href="https://map.kakao.com/link/map/${station["stationName"]},${latlng.getLat()},${latlng.getLng()}" style="" target="_blank">${station["stationName"]}</a></h4></div>`,
			});

			infowindow.open(MapManager.map, marker);

			MapManager.infowindows.push(infowindow);
			MapManager.markers.push(marker);
		}
	}
}
MapManager.map = null;
MapManager.infowindows = [];
MapManager.markers = [];
MapManager.circles = [];
