# place-recommendation-service
place recommendation service using real-time public transportation data  
실시간 공공 교통 데이터를 이용한 장소 추천 서비스  

# 개요
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
#### `relation`값 계산 예시
![image](https://user-images.githubusercontent.com/48780754/96464754-29f64600-1263-11eb-9725-eb2f513c2509.png)

하지만 이 상관분석을 이용한 relation 값은  인근 대여소끼리의 이동을 분석하다 보니 목적지에 도착하기 위해 따릉이를 사용하는 것을 확인할 수 없다는 결과가 나왔고 relation값으로 분석하는 것은 우리가 하고자 하는 분석에 적합하지 않다는 판단을 하였습니다.  

그래서 저희는 다른 지표를 선정하였습니다. 해당 대여소에서 발생한 반납과 대여 횟수를 이용하여 두가지 지표를 만들기로 하였습니다.  

2. __대여와 반납을 응용한 지표를 만들어 정렬__ : 
*retren_sum*은 일정 시간 동안 대여소에서의 반납횟수와 대여횟수의 합을 의미합니다. 목적지에 도착해서 반납을 하고 방문 후에 다시 집에 가려면 반납을 한 대여소에서 따릉이를 다시 대여해서 돌아갈 것을 가정해서 계산한 수치입니다.  

*relative_retren_sum*은 일정 시간 동안 해당 대여소에서의 어떤 시간대와 다른 어떤 시간대의 사용량을 비교해서 두 시간대 중 어느 시간대에 더 몰려있는지 알 수 있는 지표입니다. -1.0에 가까울 수록 전자 시간대에 사용량이 많고, +1.0에 가까울수록 후자에 사용량이 많습니다. *retren_sum*은 단순히 횟수를 비교하지만 *relative_retren_sum*은 상대적으로 사용량이 적지만 주말에 사용량의 증가량 비율이 큰 장소를 효과적으로 알려줍니다.


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

## 중간 조사 결과
아래는 평일과 주말간 어느날 더 많이 자전거를 빌려갔는지 직관적으로 알 수 있는 지도 그림이다.  
10월 14일부터 10월 15일 총 48시간 동안 발생한 자전거 대여와 반납 횟수를 전자 시간대 사건들이라고 하고, 10월 17일부터 10월 18일 총 48시간 동안  발생한 자전거 대여와 반납 횟수를 후자 시간대 사건들이라고 할 때,  

__첫번째 그림__은 빨강색에 가까울수록 후자 시간대에 사람들이 상대적으로 많이 이용했다는 것이고, 파랑색에 가까울수록 전자 시간대에 상대적으로 많이 이용했다는 것이다. 여기서 상대적이라는 것은 전자, 후자 이 두 시간대에서의 대여와 반납을 합산해서 비교했다는 것을 의미한다. 상대적으로 많이 이용하였다는 것은 해당 대여소에서 비교적 대여와 반납이 많이 발생하였다는 것이다.  

__두번째 그림__은 빨강색에 가까울수록 후자 시간대에 사람들이 많이 사용했다는 것이고, 파랑색에 가까울수록 전자 시간대에 많이 사용했다는 것을 의미한다.  
<img width="1126" alt="1014-1015_10171018_relative_retren_sum_delta_30%" src="https://user-images.githubusercontent.com/48780754/100385371-bca9b200-3065-11eb-82de-7ce3adec146f.png">
*첫번째 그림*  

<img width="1131" alt="1014-1015_10171018_retren_sum_delta_30%" src="https://user-images.githubusercontent.com/48780754/100385376-bf0c0c00-3065-11eb-916e-746933597058.png">
*두번째 그림*  

## 시인성 강화 결과
__아래 그림__은 위 중간 조사 결과1과 거의 동일한 시간대를 *relative_retren_sum* 지표를 이용하여 조사한 것이다.  
1.0에 가까울수록 빨강색이고, 0에 가까울수록 검정색이고, -1.0에 가까울수록 파랑색이다.  
<img width="1760" alt="101314101718" src="https://user-images.githubusercontent.com/48780754/100535178-db709a00-3259-11eb-875b-bb9b3449f890.png">

