import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const MapView = ({ routePoints }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Функция для загрузки Yandex Maps API
    const loadYandexMaps = () => {
      return new Promise((resolve, reject) => {
        // Проверяем, загружен ли уже API
        if (window.ymaps) {
          resolve(window.ymaps);
          return;
        }

        // Создаем скрипт для загрузки API
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_API_ключ&lang=ru_RU';
        script.async = true;
        script.onload = () => {
          // Когда API загружен, инициализируем его
          window.ymaps.ready(() => {
            resolve(window.ymaps);
          });
        };
        script.onerror = (error) => {
          reject(new Error('Не удалось загрузить Yandex Maps API'));
        };

        document.body.appendChild(script);
      });
    };

    // Функция для инициализации карты
    const initMap = async () => {
      try {
        const ymaps = await loadYandexMaps();
        
        if (!mapRef.current) return;
        
        // Создаем карту
        const map = new ymaps.Map(mapRef.current, {
          center: [55.76, 37.64], // Москва по умолчанию
          zoom: 10
        });
        
        mapInstanceRef.current = map;
        
        // Если есть точки маршрута, отображаем их
        if (routePoints && routePoints.length > 0) {
          // Создаем массив координат для маршрута
          const coordinates = routePoints.map(point => [
            point.latitude || point.lat,
            point.longitude || point.lng
          ]);
          
          // Создаем ломаную линию маршрута
          const polyline = new ymaps.Polyline(
            coordinates,
            {},
            {
              strokeColor: '#1976d2',
              strokeWidth: 4,
              strokeOpacity: 0.8
            }
          );
          
          // Добавляем маркеры для каждой точки
          routePoints.forEach((point, index) => {
            const isStart = index === 0;
            const isEnd = index === routePoints.length - 1;
            
            const marker = new ymaps.Placemark(
              [point.latitude || point.lat, point.longitude || point.lng],
              {
                hintContent: point.name || (isStart ? 'Начало маршрута' : isEnd ? 'Конец маршрута' : `Точка ${index + 1}`),
                balloonContent: point.description || ''
              },
              {
                preset: isStart ? 'islands#greenDotIcon' : isEnd ? 'islands#redDotIcon' : 'islands#blueDotIcon'
              }
            );
            
            map.geoObjects.add(marker);
          });
          
          // Добавляем маршрут на карту
          map.geoObjects.add(polyline);
          
          // Устанавливаем границы карты, чтобы были видны все точки
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 30
          });
        }
      } catch (error) {
        console.error('Ошибка при инициализации карты:', error);
      }
    };

    initMap();

    // Очистка при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [routePoints]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {(!routePoints || routePoints.length === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Нет точек для отображения на карте
        </Typography>
      )}
      <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default MapView; 