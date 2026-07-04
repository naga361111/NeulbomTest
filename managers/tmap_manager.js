

/**
 * TMapManager — TMAP 지도 렌더링 모듈
 * 
 * 반드시 <head>에서 env.js 다음에 로드하세요.
 * TMAP SDK 주입과 지도 클래스를 하나의 파일로 캡슐화합니다.
 * 
 * 사용법: TMapManager.render('컨테이너id');
 */

// TMAP SDK 주입은 main.html 등 UI 진입점에서 수행하도록 변경되었습니다.

export class TMapManager {
    static currentMapObjects = []; // 그려진 마커와 폴리라인을 추적하는 배열

    /**
     * 지도에 그려진 기존 마커와 폴리라인을 모두 지웁니다.
     */
    static clearMapObjects() {
        if (TMapManager.currentMapObjects) {
            TMapManager.currentMapObjects.forEach(obj => {
                if (obj && typeof obj.setMap === 'function') {
                    obj.setMap(null);
                }
            });
            TMapManager.currentMapObjects = [];
        }
    }

    static render(containerId, lat = 37.881315, lng = 127.729970, zoom = 14) {
        if (typeof Tmapv2 === 'undefined') {
            console.error('[TMapManager] Tmapv2가 로드되지 않았습니다.');
            return null;
        }

        return new Tmapv2.Map(containerId, {
            center: new Tmapv2.LatLng(lat, lng),
            width: '100%',
            height: '100%',
            zoom: zoom
        });
    }

    /**
     * TMAP API를 이용해 두 위치(학교) 간의 실제 도보 거리 및 시간을 계산합니다.
     * @param {string} startSchool 출발지 이름 (예: 강원대학교)
     * @param {string} endSchool 도착지 이름 (예: 춘천 봄내초등학교)
     * @returns {Object|null} 거리 및 시간 객체 { distance: number, travelTime: number } 또는 null
     */
    static async calculateRealDistance(startSchool, endSchool) {
        if (!startSchool || !endSchool) return null;
        try {
            // POI 검색 헬퍼 (내부에서 공통 사용 가능하지만 일단 독립적으로 작성)
            const getPOI = async (keyword) => {
                const url = `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(keyword)}&appKey=${window.ENV.TMAP_APP_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data && data.searchPoiInfo && data.searchPoiInfo.pois && data.searchPoiInfo.pois.poi.length > 0) {
                    return data.searchPoiInfo.pois.poi[0];
                }
                return null;
            };

            const startPOI = await getPOI(startSchool);
            const endPOI = await getPOI(endSchool);

            if (!startPOI || !endPOI) return "위치 검색 실패";

            const routeUrl = `https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&appKey=${window.ENV.TMAP_APP_KEY}`;
            const routeRes = await fetch(routeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startX: startPOI.noorLon,
                    startY: startPOI.noorLat,
                    endX: endPOI.noorLon,
                    endY: endPOI.noorLat,
                    reqCoordType: "WGS84GEO",
                    resCoordType: "EPSG3857",
                    startName: encodeURIComponent(startPOI.name),
                    endName: encodeURIComponent(endPOI.name)
                })
            });

            const routeData = await routeRes.json();
            if (routeData && routeData.features && routeData.features.length > 0) {
                const totalDistance = routeData.features[0].properties.totalDistance; // 미터 단위
                const totalTime = routeData.features[0].properties.totalTime; // 초 단위

                const distKm = parseFloat((totalDistance / 1000).toFixed(1));
                const timeMin = Math.ceil(totalTime / 60);

                return { distance: distKm, travelTime: timeMin };
            }
        } catch (e) {
            console.error("[TMapManager] 거리 계산 오류:", e);
        }
        return null;
    }

    /**
     * 두 학교의 이름을 검색하고 경로를 지도에 표시합니다.
     * @param {Tmapv2.Map} map - TMAP 지도 인스턴스
     * @param {string} startSchoolName - 출발지 학교 (예: 로그인한 유저의 소속 학교)
     * @param {string} endSchoolName - 도착지 학교 (예: 선택한 카드의 학교명)
     */
    static async drawRouteBetweenSchools(map, startSchoolName, endSchoolName) {
        if (!map) return;

        try {
            // 0. 기존에 그려진 마커 및 경로 지우기
            TMapManager.clearMapObjects();

            // 1. POI 검색 (출발지, 도착지)
            const getPOI = async (keyword) => {
                const url = `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(keyword)}&appKey=${ENV.TMAP_APP_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data && data.searchPoiInfo && data.searchPoiInfo.pois && data.searchPoiInfo.pois.poi.length > 0) {
                    return data.searchPoiInfo.pois.poi[0]; // 가장 관련성 높은 첫 번째 결과
                }
                throw new Error(`POI 검색 실패: ${keyword}`);
            };

            const startPoi = await getPOI(startSchoolName);
            const endPoi = await getPOI(endSchoolName);

            const startLatLng = new Tmapv2.LatLng(startPoi.noorLat, startPoi.noorLon);
            const endLatLng = new Tmapv2.LatLng(endPoi.noorLat, endPoi.noorLon);

            // 2. 마커 추가
            const startMarker = new Tmapv2.Marker({
                position: startLatLng,
                map: map,
                title: startSchoolName,
                label: `<span style="background-color: white; padding: 2px;">출발: ${startSchoolName}</span>`
            });
            TMapManager.currentMapObjects.push(startMarker);

            const endMarker = new Tmapv2.Marker({
                position: endLatLng,
                map: map,
                title: endSchoolName,
                label: `<span style="background-color: white; padding: 2px;">도착: ${endSchoolName}</span>`
            });
            TMapManager.currentMapObjects.push(endMarker);

            // 3. 지도 중심 및 줌 조절 (출발지와 도착지가 모두 보이게)
            const bounds = new Tmapv2.LatLngBounds();
            bounds.extend(startLatLng);
            bounds.extend(endLatLng);
            map.fitBounds(bounds);

            // 4. 경로 탐색 (자동차 경로 기준)
            const routeUrl = "https://apis.openapi.sk.com/tmap/routes?version=1&format=json";
            const routeBody = {
                startX: startPoi.noorLon,
                startY: startPoi.noorLat,
                endX: endPoi.noorLon,
                endY: endPoi.noorLat,
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO",
                startName: encodeURIComponent(startSchoolName),
                endName: encodeURIComponent(endSchoolName)
            };

            const routeRes = await fetch(routeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "appKey": window.ENV.TMAP_APP_KEY
                },
                body: JSON.stringify(routeBody)
            });

            const routeData = await routeRes.json();
            
            if (!routeData || !routeData.features) {
                throw new Error("경로 데이터를 가져올 수 없습니다.");
            }

            // 5. 경로 그리기 (Polyline)
            const drawInfoArr = [];
            const features = routeData.features;
            
            for (let i in features) {
                const geometry = features[i].geometry;
                if (geometry.type === "LineString") {
                    for (let j in geometry.coordinates) {
                        const latlng = new Tmapv2.LatLng(geometry.coordinates[j][1], geometry.coordinates[j][0]);
                        drawInfoArr.push(latlng);
                    }
                }
            }

            const polyline = new Tmapv2.Polyline({
                path: drawInfoArr,
                strokeColor: "#0066FF",
                strokeWeight: 6,
                map: map
            });
            TMapManager.currentMapObjects.push(polyline);

        } catch (error) {
            console.error("[TMapManager] 경로 탐색 에러:", error);
            throw error;
        }
    }
}

if (typeof window !== 'undefined') {
    window.TMapManager = TMapManager;
}
