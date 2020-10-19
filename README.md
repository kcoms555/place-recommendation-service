# software_application
2020 3-2 소프트웨어응용 텀프로젝트

# 프로젝트 개요
연간 서울시 공공 자전거 사용자가 4000만명 대로 추산이 됩니다. 이러한 공공 자전거들의 대여소별 대여/반납 이력들을 초 단위로 잘 관찰하면 시간대별 붐비는 장소를 추정할 수 있습니다. 우리의 목표는 더 나아가 현재 서울시에서 예전과 대조를 하였을 때, 가장 인기있는/인기없는 장소 추정해내는 것입니다.

# 어떻게 구현할 것인가?
단순하게 가장 반납/대여가 더/덜 발생한 대여소를 추정해 가장 인기있는/인기없는 장소를 내는 것은 논란의 여지가 있습니다. 이렇게하면 여의나루역 출구 인근 자전거 대여소는 항상 인기 있게 됩니다. 우리가 원하는 것은 갑자기 급부상한 인스타그램 핫플레이스를 찾아내는, 혹은 사람이 눈에 띄게 줄어 편안하게 밖에 나다닐 수 있는 장소를 찾는 프로젝트입니다.  
1. __단순 대조 후 정렬__ : 현재 시각으로부터 `t`시간 전까지의 대여 이력과, 1주일 전 동일 시간대의 대여 이력을 대조하여 1주일 전과 비교하였을 때 더/덜 많은 반납이 발생 빈도의 비율을 측정하여 순위를 매긴 후, 가장 인기있는/인기없는 장소를 추정합니다.  
2. __공급자-소비자 연관 그래프 그린 후 정렬__ : 근처 `L km` 근방 거리순으로 `최대 n개`의 자전거 대여소(`neighbors`)를 얻은 후, 다음과 같은 방법으로 `t` 시간 동안 해당 대여소(`self`)를 평가합니다. 상관 분석(`Correlation Analysis`) 기법과 유사합니다.  
2.1. `neighbors`에서 발생한 반납은 `self`에서 대여가 발생한 것과 동일하게 평가합니다.  
2.2. `neighbors`에서 발생한 대여는 `self`에서 반납이 발생한 것과 동일하게 평가합니다.  
2.3. `t`시간 동안 발생한 `self`의 반납 건수를 `cnt_return`, 대여 건수를 `cnt_rental` 이라고 합니다.  
2.4. `relation`은 다음과 같이 계산합니다. `relation` = (`cnt_return` - `cnt_rental`)/(`neighbors`와 `self`의 전체 반납/대여 횟수)  
2.5. `relation`이 1.0에 가까울수록 인근 대여소에서 해당 대여소로 자전거의 이동 발생 비율이 더 높다는 것을 의미합니다. 반대로 -1.0에 가까울수록 해당 대여소에서 인근 대여소로 이동 발생 비율이 더 높다는 것을 의미합니다. 0에 가까울수록 해당 대여소는 인근 대여소와 교류가 없다는 것을 의미합니다.  
2.6. 일주일 전과 해당 `relation` 값을 대조하여 큰 순서대로 순위를 매긴 후, 가장 인기있는/인기없는 장소를 추정합니다.  


## web/
웹페이지 폴더, 데이터베이스에 접근해서 간편하게 차트로 웹에서 표현  
**서비스 url : https://jeto.ga/softapp**  


## api/
웹에서 데이터베이스에 접근하기 위해 구축한 서버 api 파일/폴더

#### 간략화된 API 구조
__GET__ *http://jeto.ga/api/softapp/bike_station_counts*  
HTTP status 200 : 전체 자전거 대여소 갯수 반환  
```
curl http://jeto.ga/api/softapp/bike_station_counts
```
```
HTTP/1.1 200 OK
Server: nginx/1.14.2
Date: Mon, 19 Oct 2020 11:54:26 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 19
Connection: keep-alive

[{"count(*)":2053}]
```

__GET__ *http://jeto.ga/api/softapp/bike_station_info*  
HTTP status 200 : 전체 자전거 대여소 정보 반환  
```
curl http://jeto.ga/api/softapp/bike_station_info
```
```
HTTP/1.1 200 OK
Server: nginx/1.14.2
Date: Mon, 19 Oct 2020 12:14:49 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 283069
Connection: keep-alive

[{"stationId":"ST-10","stationName":"108. 서교동 사거리","stationLatitude":"37.55274582","stationLongitude":"126.91861725"},{"stationId":"ST-1000","stationName":"729. 서부식자재마트 건너편","stationLatitude":"37.51037979","stationLongitude":"126.86679840"},
 (생략)]
```

__GET__ *http://jeto.ga/api/softapp/bike/:timestamp*  
HTTP status 200 : 해당 timestamp보다 크거나 같은 자전거 대여/반납 이력 중, 제일 가까운 자전거 로그를 반환. 없을 시 해당 timestamp보다 작은 자전거 기록 중, 제일 가까운 자전거 로그를 반환.  
timestamp가 음수면, 서버의 현재 시각에서 해당 초만금 빼서 timestamp로 입력.  
```
curl http://jeto.ga/api/softapp/bike/-1
```
```
HTTP/1.1 200 OK
Server: nginx/1.14.2
Date: Mon, 19 Oct 2020 12:30:28 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 82
Connection: keep-alive

[{"timestamp":1603110628,"stationId":"ST-1263","total":10,"parking":4,"shared":0}]
```

__GET__ *http://jeto.ga/api/softapp/bikes/:from/:to*  
HTTP status 200 : 두 from, to timestamp 간에 발생한 자전거 대여/반납 이력을 반환.  
timestamp가 음수면, 서버의 현재 시각에서 해당 초만금 빼서 timestamp로 입력.  
```
curl http://jeto.ga/api/softapp/bikes/-10/-1
```
```
HTTP/1.1 200 OK
Server: nginx/1.14.2
Date: Mon, 19 Oct 2020 12:40:19 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 2582
Connection: keep-alive

[{"timestamp":1603111194,"stationId":"ST-7","total":7,"parking":1,"shared":0},{"timestamp":1603111194,"stationId":"ST-300","total":12,"parking":3,"shared":0},(생략)]
```


## local/
로컬에서 자동으로 데이터를 수집하고 데이터베이스에 꾸준히 차곡차곡 저장하는 프로그램 파일/폴더
**local/soft_app_db_d.py** : 자동 수집 프로그램
**local/soft_app_db.py** : 자동 수집 클래스 정의

#### 자동 수집 프로그램 실행법
1. nohup으로 터미널 없이 작동하도록 실행
```
nohup python3 local/soft_app_db_d.py &
```
2. 터미널 종료
```
exit
```

#### 데이터베이스에서 수집하는 자료
![image](https://user-images.githubusercontent.com/48780754/96445914-9d8c5900-124b-11eb-9238-74f853908e77.png)  
![image](https://user-images.githubusercontent.com/48780754/96445867-8cdbe300-124b-11eb-8864-d9a07a48fee2.png)  
**mariadb, softapp.bike_station_info** : `stationId, stationName, stationLatitude, stationLongitude`  
**mariadb, softapp.bike_log** : `timestamp, stationId, total, parking, shared`  



## 2020.10.19 중간 수집 결과
![image](https://user-images.githubusercontent.com/48780754/96445263-9284f900-124a-11eb-8201-e1a577239b19.png)  
![image](https://user-images.githubusercontent.com/48780754/96445290-9e70bb00-124a-11eb-865e-721328ca1ffa.png)  
![image](https://user-images.githubusercontent.com/48780754/96445478-ebed2800-124a-11eb-9e2d-1614cbefdbc9.png)  
약 `289 시간` 동안, `2,511,510 개의 자전거 로그`를 획득, `일 평균 208,568개`의 로그가 누적  
