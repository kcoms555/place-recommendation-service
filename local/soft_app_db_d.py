import time
import requests
import json
import soft_app_db

def fetch_bike_items_from_web():
	q1 = json.loads(requests.get('http://openapi.seoul.go.kr:8088/55466849676b636f3638464a496f5a/json/bikeList/1/1000/').content)
	q2 = json.loads(requests.get('http://openapi.seoul.go.kr:8088/55466849676b636f3638464a496f5a/json/bikeList/1001/2000/').content)
	if q1['rentBikeStatus']['RESULT']['CODE'] != 'INFO-000':
		raise Exception(q1['rentBikeStatus']['RESULT']['MESSAGE'])
	if q2['rentBikeStatus']['RESULT']['CODE'] != 'INFO-000':
		raise Exception(q2['rentBikeStatus']['RESULT']['MESSAGE'])
	return q1['rentBikeStatus']['row'] + q2['rentBikeStatus']['row']

stationdict = {}

db = soft_app_db
station_in_db = db.get_stations_from_db()
is_there_new_station = False

while True:
	try:
		count = 0

		now = fetch_bike_items_from_web()
		timestamp = round(time.time())

		for nowitem in now:
			_id = nowitem['stationId']
			nowitem_stat = [int(nowitem['rackTotCnt']), int(nowitem['parkingBikeTotCnt']), int(nowitem['shared'])]

			# 프로그램 최초 실행시 경우 메모리에 반영 및 다음 아이템으로
			if _id not in stationdict:
				stationdict[_id] = []
				stationdict[_id].extend(nowitem_stat)

				# db에도 등록된 station이 아닐 경우 db에 추가
				if _id not in station_in_db:
					print(f'New station {_id}({nowitem["stationName"]}) added')
					db.insert_new_station(_id, nowitem['stationName'], nowitem['stationLatitude'], nowitem['stationLongitude'])
					is_there_new_station = True
					count += 1
				continue

			# 이전과 비교 변화량 측정
			change = [nowitem_stat[i] - stationdict[_id][i] for i in range(3)]

			# 변화 없을시 다음 아이템으로
			if change[0] == change[1] == change[2] == 0: continue

			# 변화 있을시 데이터베이스 반영
			for i in range(3): stationdict[_id][i] = nowitem_stat[i]
			print(f'logging {_id}({nowitem["stationName"]}) {change} {(nowitem_stat[1]/nowitem_stat[0])*100}%')
			db.insert_new_bike_log(timestamp, _id, *change)
			count += 1

		if count > 0:
			db.commit()
		if is_there_new_station:
			print(f'Stations newly added are reflected')
			is_there_new_station = False
			station_in_db = db.get_stations_from_db()
		print(count)

	except Exception as e:
		print(e)

	finally:
		time.sleep(2)
